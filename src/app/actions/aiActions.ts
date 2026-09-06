'use server';

import {
  Place,
  ItineraryDay,
  ItineraryItem,
  TimeSlot,
  TripSource,
  AITier,
  ValidationSummary,
  AIResponse,
  GenerateItineraryInput,
  ExtractLocationsInput,
} from '@/lib/types/ghoomo';
import { calculateDistanceKm, generateProximityItinerary } from '@/features/itinerary/clustering';
import { matchPlaceToReference, searchPlacesReference, enrichPlace } from '@/features/social-import/referenceMatcher';
import { extractLocationsFromSocialUrl, fetchSocialPageMetadata, ExtractionResult } from '@/features/social-import/extractors';
import { extractVideoVoiceTranscript } from '@/features/social-import/transcriptService';
import { geocodePlaceWithOSM } from '@/features/social-import/geocoder';
import { validateTravelUrl } from '@/lib/validation/urlValidator';
import { sanitizePromptText, sanitizePlaceName } from '@/lib/validation/sanitize';
import { checkItineraryRateLimit } from '@/lib/security/rateLimiter';
import { tier1CircuitBreaker } from '@/lib/security/circuitBreaker';
import { safeLog } from '@/lib/security/logger';
import { deductUserCredits, CREDIT_COSTS } from '@/lib/services/creditService';

// ============================================================================
// Timeouts & Execution Configuration
// ============================================================================

const TIMEOUT_TIER1_MS = 5000; // Exact 5 seconds for Gemini 1.5 Flash
const TIMEOUT_TIER2_MS = 3000; // Exact 3 seconds for Groq Llama 3.1 70B
const MAX_PLACES_PER_DAY = 8;
const IDEAL_MAX_PLACES_PER_DAY = 6;
const MAX_TRAVEL_TIME_HOURS = 2.0; // Alert if consecutive stops exceed 2 hours (~70 km)
const AVG_SPEED_KMH = 35.0; // Realistic India scenic/hill transit speed

// Helper for promise timeout with AbortController
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Robust JSON Parser for AI Outputs
 * Safely strips markdown code fences and isolates valid JSON payloads.
 */
function parseJsonFromModelOutput(text: string): any {
  if (!text) return null;
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ============================================================================
// Post-Processing Validation Pipeline
// ============================================================================

export async function validateAndOptimizeItinerary(
  days: ItineraryDay[],
  placesMap: Map<string, Place>
): Promise<{ validatedDays: ItineraryDay[]; validation: ValidationSummary }> {
  const warnings: string[] = [];
  const travelAlerts: string[] = [];
  let flaggedForReview = false;
  let totalDistanceKm = 0;
  let maxPlacesCount = 0;

  const validatedDays = days.map((day) => {
    let items = [...day.items];
    maxPlacesCount = Math.max(maxPlacesCount, items.length);

    // Rule 1: Max 6-8 places per day enforcement
    if (items.length > MAX_PLACES_PER_DAY) {
      warnings.push(
        `Day ${day.dayNumber} contained ${items.length} stops. Capped to ${MAX_PLACES_PER_DAY} to prevent travel fatigue.`
      );
      items = items.slice(0, MAX_PLACES_PER_DAY);
    } else if (items.length > IDEAL_MAX_PLACES_PER_DAY) {
      warnings.push(
        `Day ${day.dayNumber} has ${items.length} places. Consider an easy pace for hill and city traffic.`
      );
    }

    // Rule 2 & 4: Geographic proximity ordering (Nearest-Neighbor sequence)
    if (items.length > 2) {
      const sortedItems: ItineraryItem[] = [items[0]];
      const remaining = items.slice(1);

      while (remaining.length > 0) {
        const lastPlaceId = sortedItems[sortedItems.length - 1].placeId;
        const lastPlace = placesMap.get(lastPlaceId);

        let nearestIdx = 0;
        let minDistance = Infinity;

        remaining.forEach((item, idx) => {
          const candPlace = placesMap.get(item.placeId);
          if (lastPlace && candPlace) {
            const d = calculateDistanceKm(lastPlace.lat, lastPlace.lng, candPlace.lat, candPlace.lng);
            if (d < minDistance) {
              minDistance = d;
              nearestIdx = idx;
            }
          }
        });

        sortedItems.push(remaining.splice(nearestIdx, 1)[0]);
      }
      items = sortedItems;
    }

    // Rule 3: Check travel time between consecutive places (< 2 hours ideal)
    for (let i = 0; i < items.length - 1; i++) {
      const p1 = placesMap.get(items[i].placeId);
      const p2 = placesMap.get(items[i + 1].placeId);

      if (p1 && p2) {
        const distKm = calculateDistanceKm(p1.lat, p1.lng, p2.lat, p2.lng);
        totalDistanceKm += distKm;
        const estTravelHours = distKm / AVG_SPEED_KMH;

        if (estTravelHours > MAX_TRAVEL_TIME_HOURS) {
          flaggedForReview = true;
          const alertMsg = `High travel time on Day ${day.dayNumber}: ${p1.name} → ${p2.name} is ~${distKm.toFixed(1)} km (~${estTravelHours.toFixed(1)} hrs).`;
          travelAlerts.push(alertMsg);
          warnings.push(alertMsg);
        }
      }
    }

    // Update order index & time slots
    const slots: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night'];
    const updatedItems = items.map((item, idx) => {
      const slot = slots[Math.min(idx, slots.length - 1)];
      return {
        ...item,
        orderIndex: idx,
        timeSlot: slot,
      };
    });

    return {
      ...day,
      items: updatedItems,
    };
  });

  return {
    validatedDays,
    validation: {
      warnings,
      maxPlacesPerDay: maxPlacesCount,
      flaggedForReview,
      consecutiveTravelAlerts: travelAlerts,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      isGeographicallyGrouped: travelAlerts.length === 0,
    },
  };
}

// ============================================================================
// Model Configurations Requested by User (Use these models only)
// ============================================================================

const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-flash-latest',
];

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'qwen/qwen3.6-27b',
];

const HUGGINGFACE_MODELS = [
  'Qwen/Qwen2.5-72B-Instruct',
  'Qwen/Qwen2.5-Coder-32B-Instruct',
  'Qwen/Qwen3.8-27B',
  'Qwen/Qwen3.8-Flash-Next',
  'deepseek-ai/DeepSeek-V4-Flash-0731',
];

// ============================================================================
// Tier 1: Gemini Models (Iterates through GEMINI_MODELS only)
// ============================================================================

async function callGeminiModels(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your-gemini')) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      });

      const res = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        },
        TIMEOUT_TIER1_MS
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch {
      // Cascade to next model in GEMINI_MODELS
    }
  }

  throw new Error('All configured Gemini models failed');
}

// ============================================================================
// Tier 2: Groq Models (Iterates through GROQ_MODELS only)
// ============================================================================

async function callGroqModels(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey || apiKey.includes('your-grok')) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  for (const model of GROQ_MODELS) {
    try {
      const body = JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an expert travel assistant. Always output clean, valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const res = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body,
        },
        TIMEOUT_TIER2_MS
      );

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch {
      // Cascade to next model candidate in GROQ_MODELS
    }
  }

  throw new Error('All configured Groq models failed');
}

// ============================================================================
// Tier 2b: Hugging Face Models (Iterates through HUGGINGFACE_MODELS only)
// ============================================================================

async function callHuggingFaceModels(prompt: string): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY;
  if (!apiKey || apiKey.includes('your-huggingface')) {
    throw new Error('HUGGINGFACE_API_KEY is not configured');
  }

  for (const model of HUGGINGFACE_MODELS) {
    try {
      // 1. Try Chat Completions router
      const res = await fetchWithTimeout(
        'https://api-inference.huggingface.co/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are an expert travel assistant. Always output clean, valid JSON only.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 2048,
          }),
        },
        TIMEOUT_TIER2_MS
      );

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }

      // 2. Direct model inference fallback
      const directRes = await fetchWithTimeout(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { max_new_tokens: 2048, return_full_text: false },
          }),
        },
        TIMEOUT_TIER2_MS
      );

      if (directRes.ok) {
        const directData = await directRes.json();
        const text = Array.isArray(directData) ? directData[0]?.generated_text : directData?.generated_text;
        if (text) return text;
      }
    } catch {
      // Cascade to next model candidate in HUGGINGFACE_MODELS
    }
  }

  throw new Error('All configured Hugging Face models failed');
}

// ============================================================================
// Server Action: generateItineraryAction
// ============================================================================

export async function generateItineraryAction(
  input: GenerateItineraryInput
): Promise<AIResponse<{ days: ItineraryDay[]; updatedPlaces: Place[] }>> {
  const startTime = Date.now();
  const { tripId, destination, durationDays, places } = input;

  // 1. Rate Limiting Guardrail (Max 5 generations / hour / user)
  const rateCheck = checkItineraryRateLimit(tripId || 'guest_user');
  if (!rateCheck.allowed) {
    safeLog('warn', 'RateLimit', `Throttled itinerary generation for trip ${tripId}: ${rateCheck.error}`);
    return {
      success: false,
      data: { days: [], updatedPlaces: places },
      tierUsed: 'tier3_rule_based',
      durationMs: Date.now() - startTime,
      validation: {
        warnings: [rateCheck.error || 'Rate limit exceeded.'],
        maxPlacesPerDay: 0,
        flaggedForReview: true,
        consecutiveTravelAlerts: [],
        totalDistanceKm: 0,
        isGeographicallyGrouped: false,
      },
      error: rateCheck.error,
      message: rateCheck.error || 'Rate limit exceeded. Please wait a few minutes before trying again.',
    };
  }

  // 1b. Credit System Check (Cost: 3 Credits for Full Itinerary Generation)
  const activeUserId = input.userId || 'user-traveler-8472';
  const creditCheck = await deductUserCredits(activeUserId, CREDIT_COSTS.ITINERARY_GENERATION);
  if (!creditCheck.success) {
    safeLog('warn', 'Credits', `User ${activeUserId} has insufficient credits for itinerary generation.`);
    return {
      success: false,
      data: { days: [], updatedPlaces: places },
      tierUsed: 'tier3_rule_based',
      durationMs: Date.now() - startTime,
      validation: {
        warnings: ['Insufficient credits (3 credits required).'],
        maxPlacesPerDay: 0,
        flaggedForReview: true,
        consecutiveTravelAlerts: [],
        totalDistanceKm: 0,
        isGeographicallyGrouped: false,
      },
      error: 'INSUFFICIENT_CREDITS',
      message: 'You need 3 credits to generate a smart trip plan. Please upgrade your plan or top up credits.',
    };
  }

  // 2. Input Sanitization Guardrail
  const cleanDestination = sanitizePromptText(destination || 'India', 100);
  const cleanPlaces = places.map((p) => ({
    ...p,
    name: sanitizePlaceName(p.name),
    notes: p.notes ? sanitizePromptText(p.notes, 200) : undefined,
  }));

  // Build place reference map for validation
  const placesMap = new Map<string, Place>();
  cleanPlaces.forEach((p) => placesMap.set(p.id, p));

  const prompt = `You are an Indian Smart Tourism AI. Group the following places in ${cleanDestination} into ${durationDays} days.
Places available:
${cleanPlaces.map((p, idx) => `${idx + 1}. [ID: ${p.id}] ${p.name} (Category: ${p.category}, Lat: ${p.lat}, Lng: ${p.lng})`).join('\n')}

Rules:
1. Max 6-8 places per day.
2. Group places by geographic proximity to keep travel time under 2 hours between stops.
3. Assign timeSlots: morning, afternoon, evening, night.

Output strict JSON in this exact structure:
{
  "days": [
    {
      "dayNumber": 1,
      "theme": "Historic Sights & Heritage",
      "placeIds": ["${cleanPlaces[0]?.id || 'p1'}"]
    }
  ]
}`;

  // --------------------------------------------------------------------------
  // TIER 1: Gemini Models (Iterates GEMINI_MODELS)
  // --------------------------------------------------------------------------
  if (tier1CircuitBreaker.isAvailable()) {
    try {
      const rawJson = await callGeminiModels(prompt);
      const parsed = parseJsonFromModelOutput(rawJson);

      if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
        tier1CircuitBreaker.recordSuccess();

        const generatedDays: ItineraryDay[] = parsed.days.map((d: any, dayIdx: number) => {
          const dayId = `day-${d.dayNumber || dayIdx + 1}-${Date.now()}`;
          const pIds: string[] = Array.isArray(d.placeIds) ? d.placeIds : [];

          const items: ItineraryItem[] = pIds
            .map((pId: string, idx: number) => {
              const pl = placesMap.get(pId);
              if (!pl) return null;
              return {
                id: `item-${dayIdx + 1}-${idx}-${Date.now()}`,
                dayId,
                placeId: pId,
                orderIndex: idx,
                timeSlot: (idx === 0 ? 'morning' : idx === 1 ? 'afternoon' : 'evening') as TimeSlot,
                durationMinutes: 90,
                notes: `AI Curated • ${pl.category}`,
                place: pl,
              };
            })
            .filter(Boolean) as ItineraryItem[];

          return {
            id: dayId,
            tripId,
            dayNumber: d.dayNumber || dayIdx + 1,
            theme: d.theme || `Day ${dayIdx + 1}: ${cleanDestination} Highlights`,
            items,
          };
        });

        const { validatedDays, validation } = await validateAndOptimizeItinerary(generatedDays, placesMap);
        const updatedPlaces = Array.from(placesMap.values());

        return {
          success: true,
          data: { days: validatedDays, updatedPlaces },
          tierUsed: 'tier1_gemini',
          durationMs: Date.now() - startTime,
          validation,
          message: 'Smart trip plan created with Gemini models.',
        };
      }
    } catch (tier1Err: any) {
      tier1CircuitBreaker.recordFailure(tier1Err.message);
      safeLog('warn', 'AI_Fallback', `Tier 1 (Gemini) failed, proceeding to Tier 2: ${tier1Err.message}`);
    }
  } else {
    safeLog(
      'warn',
      'CircuitBreaker',
      'Tier 1 Circuit is OPEN (3 consecutive failures). Fast-pathing directly to Tier 2 backup.'
    );
  }

  // --------------------------------------------------------------------------
  // TIER 2: Groq Models (Iterates GROQ_MODELS)
  // --------------------------------------------------------------------------
  try {
    const rawJson = await callGroqModels(prompt);
    const parsed = parseJsonFromModelOutput(rawJson);

    if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
      const generatedDays: ItineraryDay[] = parsed.days.map((d: any, dayIdx: number) => {
        const dayId = `day-${d.dayNumber || dayIdx + 1}-${Date.now()}`;
        const pIds: string[] = Array.isArray(d.placeIds) ? d.placeIds : [];

        const items: ItineraryItem[] = pIds
          .map((pId: string, idx: number) => {
            const pl = placesMap.get(pId);
            if (!pl) return null;
            return {
              id: `item-${dayIdx + 1}-${idx}-${Date.now()}`,
              dayId,
              placeId: pId,
              orderIndex: idx,
              timeSlot: (idx === 0 ? 'morning' : idx === 1 ? 'afternoon' : 'evening') as TimeSlot,
              durationMinutes: 90,
              notes: `Groq AI Curated • ${pl.category}`,
              place: pl,
            };
          })
          .filter(Boolean) as ItineraryItem[];

        return {
          id: dayId,
          tripId,
          dayNumber: d.dayNumber || dayIdx + 1,
          theme: d.theme || `Day ${dayIdx + 1}: ${destination} Highlights`,
          items,
        };
      });

      const { validatedDays, validation } = await validateAndOptimizeItinerary(generatedDays, placesMap);
      const updatedPlaces = Array.from(placesMap.values());

      return {
        success: true,
        data: { days: validatedDays, updatedPlaces },
        tierUsed: 'tier2_groq',
        durationMs: Date.now() - startTime,
        validation,
        message: 'Itinerary generated via Groq models.',
      };
    }
  } catch (tier2Err: any) {
    console.warn('[AI Pipeline] Tier 2 (Groq) failed, proceeding to Hugging Face:', tier2Err.message);
  }

  // --------------------------------------------------------------------------
  // TIER 2b: Hugging Face Models (Iterates HUGGINGFACE_MODELS)
  // --------------------------------------------------------------------------
  try {
    const rawJson = await callHuggingFaceModels(prompt);
    const parsed = parseJsonFromModelOutput(rawJson);

    if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
      const generatedDays: ItineraryDay[] = parsed.days.map((d: any, dayIdx: number) => {
        const dayId = `day-${d.dayNumber || dayIdx + 1}-${Date.now()}`;
        const pIds: string[] = Array.isArray(d.placeIds) ? d.placeIds : [];

        const items: ItineraryItem[] = pIds
          .map((pId: string, idx: number) => {
            const pl = placesMap.get(pId);
            if (!pl) return null;
            return {
              id: `item-${dayIdx + 1}-${idx}-${Date.now()}`,
              dayId,
              placeId: pId,
              orderIndex: idx,
              timeSlot: (idx === 0 ? 'morning' : idx === 1 ? 'afternoon' : 'evening') as TimeSlot,
              durationMinutes: 90,
              notes: `Hugging Face Curated • ${pl.category}`,
              place: pl,
            };
          })
          .filter(Boolean) as ItineraryItem[];

        return {
          id: dayId,
          tripId,
          dayNumber: d.dayNumber || dayIdx + 1,
          theme: d.theme || `Day ${dayIdx + 1}: ${destination} Highlights`,
          items,
        };
      });

      const { validatedDays, validation } = await validateAndOptimizeItinerary(generatedDays, placesMap);
      const updatedPlaces = Array.from(placesMap.values());

      return {
        success: true,
        data: { days: validatedDays, updatedPlaces },
        tierUsed: 'tier2_huggingface',
        durationMs: Date.now() - startTime,
        validation,
        message: 'Itinerary generated via Hugging Face models.',
      };
    }
  } catch (hfErr: any) {
    console.warn('[AI Pipeline] Tier 2b (Hugging Face) failed:', hfErr.message);
  }

  // --------------------------------------------------------------------------
  // TIER 3: Rule-Based Haversine Clustering (Instant Zero-Crash Fallback)
  // --------------------------------------------------------------------------
  const fallbackResult = generateProximityItinerary(places, durationDays, tripId);
  const { validatedDays, validation } = await validateAndOptimizeItinerary(fallbackResult.days, placesMap);

  return {
    success: true,
    data: { days: validatedDays, updatedPlaces: fallbackResult.updatedPlaces },
    tierUsed: 'tier3_rule_based',
    durationMs: Date.now() - startTime,
    validation,
    message: 'Itinerary generated using Tier 3 Rule-Based Proximity Clustering.',
  };
}

// ============================================================================
// Server Action: extractLocationsFromUrlAction
// ============================================================================

export async function extractLocationsFromUrlAction(
  input: ExtractLocationsInput
): Promise<AIResponse<ExtractionResult>> {
  const startTime = Date.now();
  const { url } = input;

  // 1. Client + Server URL Validation Guardrail
  const urlValidation = validateTravelUrl(url);
  if (!urlValidation.isValid) {
    safeLog('warn', 'URL_Validation', `Rejected URL: "${url}" - ${urlValidation.error}`);
    return {
      success: false,
      data: {
        source: {
          url,
          platform: 'instagram',
          title: 'Unsupported Travel Link',
          author: 'Unknown',
          thumbnailUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
        },
        places: [],
      },
      tierUsed: 'tier3_rule_based',
      durationMs: Date.now() - startTime,
      validation: {
        warnings: [urlValidation.error || 'Invalid URL.'],
        maxPlacesPerDay: 0,
        flaggedForReview: true,
        consecutiveTravelAlerts: [],
        totalDistanceKm: 0,
        isGeographicallyGrouped: false,
      },
      error: urlValidation.error,
      message: urlValidation.error || 'Please provide an Instagram Reel, YouTube Short, or travel blog article.',
    };
  }

  // 1b. Credit System Check (Cost: 1 Credit for Location Extraction)
  const activeUserId = input.userId || 'user-traveler-8472';
  const creditCheck = await deductUserCredits(activeUserId, CREDIT_COSTS.LOCATION_EXTRACTION);
  if (!creditCheck.success) {
    safeLog('warn', 'Credits', `User ${activeUserId} has insufficient credits for URL extraction.`);
    return {
      success: false,
      data: {
        source: {
          url,
          platform: 'instagram',
          title: 'Insufficient Credits',
          author: 'Unknown',
          thumbnailUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
        },
        places: [],
      },
      tierUsed: 'tier3_rule_based',
      durationMs: Date.now() - startTime,
      validation: {
        warnings: ['Insufficient credits (1 credit required).'],
        maxPlacesPerDay: 0,
        flaggedForReview: true,
        consecutiveTravelAlerts: [],
        totalDistanceKm: 0,
        isGeographicallyGrouped: false,
      },
      error: 'INSUFFICIENT_CREDITS',
      message: 'You need 1 credit to extract places from a travel link. Please upgrade your plan or top up credits.',
    };
  }

  const safeUrl = sanitizePromptText(url, 500);

  // 1. Extract voice speech transcript and metadata from video
  const transcriptResult = await extractVideoVoiceTranscript(safeUrl);
  const scrapedMeta = await fetchSocialPageMetadata(safeUrl);

  const postTitle = transcriptResult.title || scrapedMeta.title || 'Travel Video';
  const authorHandle = transcriptResult.author || scrapedMeta.author || '@traveler';
  const postThumbnail = transcriptResult.thumbnailUrl || scrapedMeta.thumbnailUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
  const voiceTranscript = transcriptResult.transcript || scrapedMeta.description || '';

  // If no voice transcript was detected, proceed with multimodal visual & OCR metadata instead of failing
  const hasVoice = Boolean(voiceTranscript && voiceTranscript.trim().length >= 10);
  const effectiveContent = hasVoice
    ? voiceTranscript
    : `Visual & text-based travel reel for "${postTitle}". Platform: ${transcriptResult.platform || scrapedMeta.platform}. Description: ${scrapedMeta.description || postTitle}.`;


  const aiPrompt = `You are an expert travel assistant. We extracted travel information, OCR text, visual cues, and audio from a travel video:
URL: "${safeUrl}"
Video Title: "${postTitle}"
Video Content / Audio / On-Screen Text:
"""
${effectiveContent.slice(0, 10000)}
"""
Platform: "${transcriptResult.platform || scrapedMeta.platform}"

CRITICAL INSTRUCTIONS:
1. First, check if ANY real geographic travel location, city, state, country, or tourist spot is shown, written, or mentioned in the video.
   - If NO geographic travel destination or places can be detected, you MUST respond ONLY with:
     {
       "locationDetected": false,
       "reason": "Location cannot be detected from this travel video."
     }
2. If travel locations ARE mentioned/spoken, set "locationDetected": true.
   - "destination": Specify primary destination ("City/Region, Country", e.g. "Switzerland", "Manali, Himachal Pradesh", "Paris, France").
   - "title": Clean, descriptive trip title based on the video.
   - "places": Array of real places/attractions mentioned or associated with this destination (extract all locations and tourist spots mentioned in the transcript, between 3 and 8 places). Each place MUST have:
     - "name": Exact place name
     - "city": City or valley/region
     - "state": State, Canton, or Province
     - "country": Country name
     - "lat": Accurate latitude number (e.g. 46.8 for Switzerland, 32.2 for Manali)
     - "lng": Accurate longitude number (e.g. 8.2 for Switzerland, 77.1 for Manali)
     - "category": Scenic category (e.g. viewpoint, heritage, nature, adventure, scenic railway, lake)
     - "notes": Concise highlight inspired by the speech
   - "durationDays": If the speaker mentions trip duration in days (e.g. "3-day trip", "4 days", "weekend trip"), use that integer. Otherwise, determine the best ideal duration (integer between 2 and 7).
   - "budgetTotal": If the speaker mentions a budget or price (e.g. "under 20000 rupees", "50k budget"), convert to approximate INR integer. Otherwise, calculate the best realistic total budget in INR for this trip.
   - "checklist": If the speaker mentions things to pack, tips, or checklist items, extract them. Otherwise, generate 3 to 5 essential destination-specific checklist items.

Respond ONLY with valid JSON in this exact structure:
{
  "locationDetected": true,
  "destination": "Destination City/Region, Country",
  "title": "Clean trip title",
  "durationDays": 4,
  "budgetTotal": 35000,
  "checklist": ["Essential item 1", "Essential item 2", "Essential item 3"],
  "places": [
    {
      "name": "Place Name",
      "city": "City",
      "state": "State",
      "country": "Country",
      "lat": 46.75,
      "lng": 8.04,
      "category": "viewpoint",
      "notes": "Highlight from speech"
    }
  ]
}`;

  // Helper to format a successful AI extraction response
  const formatSuccessResponse = async (parsed: any, tier: AITier, tierName: string): Promise<AIResponse<ExtractionResult>> => {
    const enrichedPlaces = await Promise.all(
      parsed.places.map(async (p: any) => {
        let lat = typeof p.lat === 'number' && !isNaN(p.lat) && p.lat !== 0 ? p.lat : undefined;
        let lng = typeof p.lng === 'number' && !isNaN(p.lng) && p.lng !== 0 ? p.lng : undefined;

        // If coordinates missing or default Jaipur fallback, query OpenStreetMap Nominatim for true coordinates
        if (!lat || !lng || (lat === 26.9124 && lng === 75.7873 && p.city && !p.city.toLowerCase().includes('jaipur'))) {
          const geo = await geocodePlaceWithOSM(p.name, p.city, p.state || parsed.destination);
          if (geo) {
            lat = geo.lat;
            lng = geo.lng;
          }
        }

        const enriched = enrichPlace({
          ...p,
          lat,
          lng,
        });

        return {
          ...enriched,
          lat: lat || enriched.lat,
          lng: lng || enriched.lng,
          imageUrl: p.imageUrl || postThumbnail,
        };
      })
    );

    return {
      success: true,
      data: {
        source: {
          url: safeUrl,
          platform: urlValidation.platform || transcriptResult.platform || 'instagram',
          title: sanitizePromptText(parsed.title || postTitle, 150),
          author: sanitizePromptText(parsed.author || authorHandle, 60),
          thumbnailUrl: postThumbnail,
          rawTranscript: voiceTranscript,
        },
        places: enrichedPlaces,
        destination: sanitizePromptText(parsed.destination || enrichedPlaces[0]?.city || 'Travel Destination', 100),
        durationDays: typeof parsed.durationDays === 'number' && parsed.durationDays > 0 ? parsed.durationDays : 3,
        budgetTotal: typeof parsed.budgetTotal === 'number' && parsed.budgetTotal > 0 ? parsed.budgetTotal : 20000,
        checklist: Array.isArray(parsed.checklist) && parsed.checklist.length > 0 ? parsed.checklist : [
          'Confirm accommodations and transit',
          'Pack clothes suited for local weather',
          'Keep ID and emergency contacts handy',
        ],
      },
      tierUsed: tier,
      durationMs: Date.now() - startTime,
      validation: {
        warnings: [],
        maxPlacesPerDay: enrichedPlaces.length,
        flaggedForReview: false,
        consecutiveTravelAlerts: [],
        totalDistanceKm: 0,
        isGeographicallyGrouped: true,
      },
      message: `Extracted locations from video speech using ${tierName}.`,
    };
  };

  // Helper to format a location-not-detected error response
  const formatNoLocationResponse = (tier: AITier): AIResponse<ExtractionResult> => ({
    success: false,
    data: {
      source: {
        url: safeUrl,
        platform: urlValidation.platform || transcriptResult.platform || 'instagram',
        title: postTitle,
        author: authorHandle,
        thumbnailUrl: postThumbnail,
      },
      places: [],
    },
    tierUsed: tier,
    durationMs: Date.now() - startTime,
    validation: {
      warnings: ['Location cannot be detected from this video transcript.'],
      maxPlacesPerDay: 0,
      flaggedForReview: true,
      consecutiveTravelAlerts: [],
      totalDistanceKm: 0,
      isGeographicallyGrouped: false,
    },
    error: 'Location cannot be detected from this video transcript.',
    message: 'Location cannot be detected from this video transcript. Please provide a video where travel destinations or spots are spoken or mentioned.',
  });

  // --------------------------------------------------------------------------
  // TIER 1: Gemini Models (Iterates GEMINI_MODELS)
  // --------------------------------------------------------------------------
  if (tier1CircuitBreaker.isAvailable()) {
    try {
      const rawJson = await callGeminiModels(aiPrompt);
      const parsed = parseJsonFromModelOutput(rawJson);

      if (parsed) {
        if (parsed.locationDetected === false) {
          return formatNoLocationResponse('tier1_gemini');
        }
        if (Array.isArray(parsed.places) && parsed.places.length > 0) {
          tier1CircuitBreaker.recordSuccess();
          return await formatSuccessResponse(parsed, 'tier1_gemini', 'Gemini models');
        }
      }
    } catch (err: any) {
      tier1CircuitBreaker.recordFailure(err.message);
      safeLog('warn', 'AI_Fallback', `Tier 1 extract failed, falling back to Tier 2: ${err.message}`);
    }
  } else {
    safeLog('warn', 'CircuitBreaker', 'Tier 1 Circuit is OPEN. Skipping Gemini directly to Tier 2 Groq.');
  }

  // --------------------------------------------------------------------------
  // TIER 2: Groq Models (Iterates GROQ_MODELS)
  // --------------------------------------------------------------------------
  try {
    const rawJson = await callGroqModels(aiPrompt);
    const parsed = parseJsonFromModelOutput(rawJson);

    if (parsed) {
      if (parsed.locationDetected === false) {
        return formatNoLocationResponse('tier2_groq');
      }
      if (Array.isArray(parsed.places) && parsed.places.length > 0) {
        return await formatSuccessResponse(parsed, 'tier2_groq', 'Groq models');
      }
    }
  } catch (err: any) {
    console.warn('[AI Pipeline] Tier 2 (Groq) extract failed, falling back to Hugging Face:', err.message);
  }

  // --------------------------------------------------------------------------
  // TIER 2b: Hugging Face Models (Iterates HUGGINGFACE_MODELS)
  // --------------------------------------------------------------------------
  try {
    const rawJson = await callHuggingFaceModels(aiPrompt);
    const parsed = parseJsonFromModelOutput(rawJson);

    if (parsed) {
      if (parsed.locationDetected === false) {
        return formatNoLocationResponse('tier2_huggingface');
      }
      if (Array.isArray(parsed.places) && parsed.places.length > 0) {
        return await formatSuccessResponse(parsed, 'tier2_huggingface', 'Hugging Face models');
      }
    }
  } catch (err: any) {
    console.warn('[AI Pipeline] Tier 2b (Hugging Face) extract failed:', err.message);
  }

  // --------------------------------------------------------------------------
  // TIER 3: Rule-Based Reference Extractor (Only if city mentioned in speech)
  // --------------------------------------------------------------------------
  try {
    const fallback = await extractLocationsFromSocialUrl(safeUrl, scrapedMeta);
    if (fallback && fallback.places && fallback.places.length > 0) {
      return {
        success: true,
        data: fallback,
        tierUsed: 'tier3_rule_based',
        durationMs: Date.now() - startTime,
        validation: {
          warnings: [],
          maxPlacesPerDay: fallback.places.length,
          flaggedForReview: false,
          consecutiveTravelAlerts: [],
          totalDistanceKm: 0,
          isGeographicallyGrouped: true,
        },
        message: 'Extracted locations from video speech using Reference Dataset.',
      };
    }
  } catch {}

  // Strictly return error if location cannot be detected (Zero mock data)
  return formatNoLocationResponse('tier3_rule_based');
}

// ============================================================================
// Server Action: enrichPlaceAction
// ============================================================================

export async function enrichPlaceAction(input: {
  name: string;
  city?: string;
  state?: string;
  userId?: string;
}): Promise<AIResponse<Omit<Place, 'id' | 'tripId' | 'createdAt'>>> {
  const startTime = Date.now();

  const activeUserId = input.userId || 'user-traveler-8472';
  const creditCheck = await deductUserCredits(activeUserId, CREDIT_COSTS.PLACE_ENRICHMENT);
  if (!creditCheck.success) {
    safeLog('warn', 'Credits', `User ${activeUserId} has insufficient credits for place enrichment.`);
    return {
      success: false,
      data: {
        name: input.name,
        city: input.city || 'India',
        state: input.state || 'India',
        lat: 20.5937,
        lng: 78.9629,
        category: 'attraction',
        confidence: 0.5,
      },
      tierUsed: 'tier3_rule_based',
      durationMs: Date.now() - startTime,
      validation: {
        warnings: ['Insufficient credits (1 credit required).'],
        maxPlacesPerDay: 1,
        flaggedForReview: true,
        consecutiveTravelAlerts: [],
        totalDistanceKm: 0,
        isGeographicallyGrouped: true,
      },
      error: 'INSUFFICIENT_CREDITS',
      message: 'You need 1 credit to enrich a place. Please upgrade your plan or top up credits.',
    };
  }

  const enriched = enrichPlace(input);

  return {
    success: true,
    data: enriched,
    tierUsed: 'tier3_rule_based',
    durationMs: Date.now() - startTime,
    validation: {
      warnings: [],
      maxPlacesPerDay: 1,
      flaggedForReview: false,
      consecutiveTravelAlerts: [],
      totalDistanceKm: 0,
      isGeographicallyGrouped: true,
    },
    message: `Enriched '${enriched.name}' with canonical GPS and imagery.`,
  };
}
