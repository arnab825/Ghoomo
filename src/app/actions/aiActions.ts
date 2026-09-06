'use server';

import { Place, ItineraryDay, ItineraryItem, TimeSlot, TripSource } from '@/lib/types/ghoomo';
import { calculateDistanceKm, generateProximityItinerary } from '@/features/itinerary/clustering';
import { matchPlaceToReference, searchPlacesReference, enrichPlace } from '@/features/social-import/referenceMatcher';
import { extractLocationsFromSocialUrl, ExtractionResult } from '@/features/social-import/extractors';
import { validateTravelUrl } from '@/lib/validation/urlValidator';
import { sanitizePromptText, sanitizePlaceName } from '@/lib/validation/sanitize';
import { checkItineraryRateLimit } from '@/lib/security/rateLimiter';
import { tier1CircuitBreaker } from '@/lib/security/circuitBreaker';
import { safeLog } from '@/lib/security/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type AITier = 'tier1_gemini' | 'tier2_groq' | 'tier3_rule_based';

export interface ValidationSummary {
  warnings: string[];
  maxPlacesPerDay: number;
  flaggedForReview: boolean;
  consecutiveTravelAlerts: string[];
  totalDistanceKm: number;
  isGeographicallyGrouped: boolean;
}

export interface AIResponse<T> {
  success: boolean;
  data: T;
  tierUsed: AITier;
  durationMs: number;
  validation: ValidationSummary;
  error?: string;
  message: string;
}

export interface GenerateItineraryInput {
  tripId: string;
  destination: string;
  durationDays: number;
  places: Place[];
  travelStyle?: string;
  budgetTotal?: number;
}

export interface ExtractLocationsInput {
  url: string;
  tripId?: string;
}

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
// Tier 1: Gemini 1.5 Flash (5s timeout, 1 retry with exponential backoff)
// ============================================================================

async function callGemini15Flash(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your-gemini')) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

  // Attempt 1
  try {
    const res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }, TIMEOUT_TIER1_MS);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err: any) {
    // Retry 1 with exponential backoff (1s delay)
    console.warn('[AI Pipeline] Tier 1 Gemini initial attempt failed/timed out, retrying once...', err.message);
    await new Promise((r) => setTimeout(r, 1000));

    const retryRes = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }, TIMEOUT_TIER1_MS);

    if (!retryRes.ok) {
      const errText = await retryRes.text();
      throw new Error(`Gemini retry status ${retryRes.status}: ${errText}`);
    }

    const retryData = await retryRes.json();
    return retryData.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}

// ============================================================================
// Tier 2: Groq Llama 3.1 70B (3s timeout, 0 retries, instant fallback)
// ============================================================================

async function callGroqLlama70B(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey || apiKey.includes('your-grok')) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  const body = JSON.stringify({
    model: 'llama-3.1-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a helpful travel assistant. Always output clean, valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const res = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  }, TIMEOUT_TIER2_MS);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq status ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
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
  // TIER 1: Gemini 1.5 Flash (Protected by 3-Strike Circuit Breaker)
  // --------------------------------------------------------------------------
  if (tier1CircuitBreaker.isAvailable()) {
    try {
      const rawJson = await callGemini15Flash(prompt);
      const parsed = JSON.parse(rawJson);

      if (Array.isArray(parsed.days) && parsed.days.length > 0) {
        // Success: record healthy canary / normal operation in circuit breaker
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
          message: 'Smart trip plan created with Gemini 1.5 Flash.',
        };
      }
    } catch (tier1Err: any) {
      tier1CircuitBreaker.recordFailure(tier1Err.message);
      safeLog('warn', 'AI_Fallback', `Tier 1 (Gemini 1.5 Flash) failed, proceeding to Tier 2: ${tier1Err.message}`);
    }
  } else {
    safeLog(
      'warn',
      'CircuitBreaker',
      'Tier 1 Circuit is OPEN (3 consecutive failures). Fast-pathing directly to Tier 2 backup.'
    );
  }

  // --------------------------------------------------------------------------
  // TIER 2: Groq Llama 3.1 70B (Instant 3s backup)
  // --------------------------------------------------------------------------
  try {
    const rawJson = await callGroqLlama70B(prompt);
    const parsed = JSON.parse(rawJson);

    if (Array.isArray(parsed.days) && parsed.days.length > 0) {
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
              notes: `AI Backup Curated • ${pl.category}`,
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
        message: 'Itinerary generated via backup Groq Llama 3.1 70B.',
      };
    }
  } catch (tier2Err: any) {
    console.warn('[AI Pipeline] Tier 2 (Groq Llama 3.1 70B) failed:', tier2Err.message);
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

  const safeUrl = sanitizePromptText(url, 500);

  // --------------------------------------------------------------------------
  // TIER 1: Gemini 1.5 Flash (Protected by Circuit Breaker)
  // --------------------------------------------------------------------------
  if (tier1CircuitBreaker.isAvailable()) {
    try {
      const prompt = `Extract travel places, city, and coordinates from this travel URL: "${safeUrl}".
Respond ONLY with JSON matching:
{
  "title": "Title of reel",
  "author": "@creator",
  "city": "Manali",
  "places": [
    {
      "name": "Hadimba Temple",
      "city": "Manali",
      "state": "Himachal Pradesh",
      "category": "heritage",
      "notes": "Wood pagoda temple"
    }
  ]
}`;

      const rawJson = await callGemini15Flash(prompt);
      const parsed = JSON.parse(rawJson);

      if (Array.isArray(parsed.places) && parsed.places.length > 0) {
        tier1CircuitBreaker.recordSuccess();
        const enrichedPlaces = parsed.places.map((p: any) => enrichPlace(p));
        return {
          success: true,
          data: {
            source: {
              url: safeUrl,
              platform: urlValidation.platform || 'instagram',
              title: sanitizePromptText(parsed.title || 'Extracted Social Reel Experience', 150),
              author: sanitizePromptText(parsed.author || '@travel_creator', 60),
              thumbnailUrl: enrichedPlaces[0]?.imageUrl || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
            },
            places: enrichedPlaces,
          },
          tierUsed: 'tier1_gemini',
          durationMs: Date.now() - startTime,
          validation: {
            warnings: [],
            maxPlacesPerDay: enrichedPlaces.length,
            flaggedForReview: false,
            consecutiveTravelAlerts: [],
            totalDistanceKm: 0,
            isGeographicallyGrouped: true,
          },
          message: 'Extracted locations using Gemini 1.5 Flash.',
        };
      }
    } catch (err: any) {
      tier1CircuitBreaker.recordFailure(err.message);
      safeLog('warn', 'AI_Fallback', `Tier 1 extract failed, falling back to Tier 2: ${err.message}`);
    }
  } else {
    safeLog('warn', 'CircuitBreaker', 'Tier 1 Circuit is OPEN. Skipping Gemini directly to Tier 2 Groq.');
  }

  // --------------------------------------------------------------------------
  // TIER 2: Groq Llama 3.1 70B
  // --------------------------------------------------------------------------
  try {
    const prompt = `Extract locations from this travel link: "${url}". Output JSON:
{
  "title": "Reel Title",
  "places": [{ "name": "Place Name", "city": "City Name" }]
}`;

    const rawJson = await callGroqLlama70B(prompt);
    const parsed = JSON.parse(rawJson);

    if (Array.isArray(parsed.places) && parsed.places.length > 0) {
      const enrichedPlaces = parsed.places.map((p: any) => enrichPlace(p));
      return {
        success: true,
        data: {
          source: {
            url,
            platform: 'instagram',
            title: parsed.title || 'Reel Highlight Extraction',
            author: '@traveler',
            thumbnailUrl: enrichedPlaces[0]?.imageUrl || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
          },
          places: enrichedPlaces,
        },
        tierUsed: 'tier2_groq',
        durationMs: Date.now() - startTime,
        validation: {
          warnings: [],
          maxPlacesPerDay: enrichedPlaces.length,
          flaggedForReview: false,
          consecutiveTravelAlerts: [],
          totalDistanceKm: 0,
          isGeographicallyGrouped: true,
        },
        message: 'Extracted locations using Groq Llama 3.1 70B backup.',
      };
    }
  } catch (err: any) {
    console.warn('[AI Pipeline] Tier 2 extract failed:', err.message);
  }

  // --------------------------------------------------------------------------
  // TIER 3: Rule-Based Extractor & Reference Matcher
  // --------------------------------------------------------------------------
  const fallback = await extractLocationsFromSocialUrl(url);

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
    message: 'Extracted locations using Tier 3 Reference Database Matcher.',
  };
}

// ============================================================================
// Server Action: enrichPlaceAction
// ============================================================================

export async function enrichPlaceAction(input: {
  name: string;
  city?: string;
  state?: string;
}): Promise<AIResponse<Omit<Place, 'id' | 'tripId' | 'createdAt'>>> {
  const startTime = Date.now();
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
