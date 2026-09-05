import destinationsData from '@/data/destinations.json';
import fairRatesData from '@/data/fair-rates.json';
import culturalRulesData from '@/data/cultural-rules.json';
import { ItineraryPlan, ItineraryDay, ActivityItem } from '@/types';
import { ItineraryPlanSchema, ItineraryRequestSchema, DestinationInputSchema } from '../schemas/itinerary';

/**
 * Multi-LLM AI Orchestrator with Hierarchical Fallback Pipeline:
 * Tier 1: Google Gemini
 * Tier 2: Groq / Grok (Ultra-fast Llama & Qwen models)
 * Tier 3: Hugging Face (Qwen & DeepSeek models)
 * Tier 4: Curated Kaggle Dataset Engine (100% Zero-Crash execution)
 * 
 * Beginner Note:
 * If an API key is missing or an API rate-limits, this file catches the error
 * and tries the next tier automatically, so the user never sees a crash.
 */

export interface GenerateOptions {
  destination: string;
  durationDays: number;
  budget: number;
  travelStyle: string;
  interests?: string[];
}

// Model configurations for each tier (exact model list preserved)
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

/**
 * Strict Input Validation for Destination:
 * Validates against DestinationInputSchema and throws an error immediately if invalid.
 * Beginner Note: We reject invalid or malicious input rather than silently mutating
 * or falling back to 'Jaipur'.
 */
export function validateDestination(destination: string): string {
  return DestinationInputSchema.parse(destination);
}

/**
 * Builds the structured JSON prompt sent to the LLMs.
 */
function buildPrompt(options: GenerateOptions): string {
  const { destination, durationDays, budget, travelStyle } = options;
  return `You are an expert Indian Smart Tourism AI Assistant.
Create a safe, culturally respectful, realistic travel itinerary for ${destination}, India.
Duration: ${durationDays} days.
Total Budget: ₹${budget}.
Travel Style: ${travelStyle}.

SAFETY & ACCURACY GUARDRAILS:
- Recommend only verified, culturally respectful, and safe tourist landmarks in India.
- Do not recommend dangerous, non-tourist, politically sensitive, or restricted military areas.
- Include essential cultural etiquette (dress code, footwear, photography permissions).

Return ONLY a valid, parseable JSON object with NO markdown formatting, NO backticks, and NO conversational text matching this exact schema:
{
  "destination": "${destination}",
  "durationDays": ${durationDays},
  "budgetTotal": ${budget},
  "travelStyle": "${travelStyle}",
  "days": [
    {
      "dayNumber": 1,
      "theme": "Historic Heritage & Cultural Discovery",
      "activities": [
        {
          "time": "09:00 AM - 12:00 PM",
          "title": "Iconic Landmark Name",
          "location": "${destination}",
          "type": "heritage",
          "estimatedCost": 200,
          "description": "Engaging historic details.",
          "etiquetteTip": "Dress code or etiquette advice.",
          "isIndoor": false,
          "imageUrl": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
          "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}"
        }
      ]
    }
  ],
  "fairExpenseEstimate": {
    "stay": ${Math.round(budget * 0.4)},
    "transport": ${Math.round(budget * 0.2)},
    "food": ${Math.round(budget * 0.25)},
    "activities": ${Math.round(budget * 0.15)}
  },
  "scamAlerts": [
    "Check official transport rates before boarding",
    "Avoid unofficial tour touts near monuments"
  ]
}`;
}

/**
 * Helper: Extracts raw JSON from an LLM response even if wrapped in markdown backticks.
 */
function extractJson(rawText: string): string {
  const cleaned = rawText.trim();
  // Check if enclosed in markdown code fences: ```json ... ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // Otherwise find the first '{' and last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

/**
 * Validates and guardrails model output against the Zod schema.
 * Ensures image URLs and Google Maps navigation links are always populated.
 */
function guardrailAndValidateResponse(rawText: string, destination: string): ItineraryPlan | null {
  try {
    const jsonString = extractJson(rawText);
    const parsed = JSON.parse(jsonString);

    // Normalize days if model returned an object map instead of an array
    if (parsed && typeof parsed === 'object') {
      if (!Array.isArray(parsed.days) && parsed.days && typeof parsed.days === 'object') {
        parsed.days = Object.values(parsed.days);
      }
    }

    // Ensure activities have working image and directions links
    if (Array.isArray(parsed?.days)) {
      parsed.days.forEach((day: any, dIdx: number) => {
        day.dayNumber = Number(day.dayNumber) || (dIdx + 1);

        if (day.activities && !Array.isArray(day.activities) && typeof day.activities === 'object') {
          day.activities = Object.values(day.activities);
        }

        if (!Array.isArray(day.activities) || day.activities.length === 0) {
          day.activities = [
            {
              time: '09:00 AM - 12:00 PM',
              title: `${destination} Landmark Exploration`,
              location: destination,
              type: 'heritage',
              estimatedCost: 200,
              description: `Explore the vibrant culture and historic sights of ${destination}.`,
              isIndoor: false,
            },
          ];
        }

        day.activities.forEach((act: any) => {
          if (!act.imageUrl || typeof act.imageUrl !== 'string' || !act.imageUrl.startsWith('http')) {
            act.imageUrl = 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80';
          }
          if (!act.googleMapsUrl || typeof act.googleMapsUrl !== 'string' || !act.googleMapsUrl.startsWith('http')) {
            const query = encodeURIComponent(`${act.title || 'Attraction'} ${destination}`);
            act.googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
          }
        });
      });
    }

    const validation = ItineraryPlanSchema.safeParse(parsed);
    if (!validation.success) {
      console.warn('[AI Guardrail] Model output failed Zod schema guardrail:', JSON.stringify(validation.error.format(), null, 2));
      return null;
    }

    return validation.data as ItineraryPlan;
  } catch (err) {
    console.warn('[AI Guardrail] Failed to parse/guardrail model output:', err);
    return null;
  }
}

/**
 * TIER 1 HELPER: Calls Google Gemini API
 */
async function callGemini(model: string, prompt: string, apiKey: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    }
    return null;
  } catch (err) {
    console.warn(`[AI Orchestrator] Gemini (${model}) call failed:`, err);
    return null;
  }
}

/**
 * TIER 2 HELPER: Calls Groq / Grok API
 */
async function callGroq(model: string, prompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an Indian Smart Tourism AI Assistant. Return only valid raw JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data?.choices?.[0]?.message?.content?.trim() || null;
    }
    return null;
  } catch (err) {
    console.warn(`[AI Orchestrator] Groq (${model}) call failed:`, err);
    return null;
  }
}

/**
 * TIER 3 HELPER: Calls Hugging Face Inference API
 */
async function callHuggingFace(model: string, prompt: string, apiKey: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const hfUrl = `https://router.huggingface.co/hf-inference/models/${model}`;
    const response = await fetch(hfUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        inputs: `<|im_start|>system\nYou are an Indian Smart Tourism AI Assistant. Respond in valid raw JSON only.<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`,
        parameters: {
          max_new_tokens: 2048,
          temperature: 0.2,
          return_full_text: false,
        },
      }),
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text;
      }
      if (data?.generated_text) {
        return data.generated_text;
      }
    }
    return null;
  } catch (err) {
    console.warn(`[AI Orchestrator] Hugging Face (${model}) call failed:`, err);
    return null;
  }
}

/**
 * TIER 4 HELPER: Deterministic Kaggle Dataset Seed Engine
 * Guarantees 100% zero-crash operation even if network or API keys fail.
 */
function generateDeterministicFallback(destination: string, durationDays: number, budget: number): ItineraryPlan {
  console.log('[AI Orchestrator] Running Tier 4 Kaggle-seeded deterministic engine for:', destination);

  const matchedDest = destinationsData.filter(
    (d) =>
      d.city.toLowerCase() === destination.toLowerCase() ||
      d.name.toLowerCase().includes(destination.toLowerCase())
  );

  const days: ItineraryDay[] = [];
  const cityThemes = [
    'Historic Architecture & Royal Palaces',
    'Spiritual Heritage & Traditional Crafts',
    'Local Markets, Bazaars & Culinary Delights',
    'Scenic Nature & Panoramic Viewpoints',
    'Cultural Arts, Music & Folk Traditions',
  ];

  for (let dayIdx = 0; dayIdx < durationDays; dayIdx++) {
    const dayNumber = dayIdx + 1;
    const theme = cityThemes[dayIdx % cityThemes.length];
    const activities: ActivityItem[] = [];

    if (matchedDest.length > 0) {
      const primaryDest = matchedDest[dayIdx % matchedDest.length];
      activities.push({
        time: '09:00 AM - 12:30 PM',
        title: primaryDest.name,
        location: `${primaryDest.city}, ${primaryDest.state}`,
        type: 'heritage',
        estimatedCost: primaryDest.entryFee.indian,
        description: primaryDest.description,
        etiquetteTip: primaryDest.culturalEtiquette,
        isIndoor: false,
        imageUrl: primaryDest.imageUrl,
        googleMapsUrl: primaryDest.googleMapsUrl,
      });

      const secondaryDest = matchedDest[(dayIdx + 1) % matchedDest.length];
      activities.push({
        time: '02:00 PM - 04:30 PM',
        title: secondaryDest.name,
        location: `${secondaryDest.city}, ${secondaryDest.state}`,
        type: 'heritage',
        estimatedCost: secondaryDest.entryFee.indian,
        description: secondaryDest.description,
        etiquetteTip: secondaryDest.culturalEtiquette,
        isIndoor: false,
        imageUrl: secondaryDest.imageUrl,
        googleMapsUrl: secondaryDest.googleMapsUrl,
      });
    } else {
      activities.push(
        {
          time: '09:30 AM - 12:30 PM',
          title: `${destination} Heritage & Landmark Exploration`,
          location: destination,
          type: 'heritage',
          estimatedCost: 250,
          description: `Morning guided exploration of prominent historical landmarks and architectural heritage in ${destination}.`,
          isIndoor: false,
          imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
          googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination + ' landmark')}`,
        },
        {
          time: '02:00 PM - 05:00 PM',
          title: `${destination} Cultural Bazaar & Handicrafts`,
          location: destination,
          type: 'culture',
          estimatedCost: 350,
          description: `Experience authentic local traditions, verified GI-tagged artisans, and traditional street delicacies in ${destination}.`,
          isIndoor: true,
          imageUrl: 'https://images.unsplash.com/photo-1600100397608-f010f445b988?auto=format&fit=crop&w=800&q=80',
          googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination + ' market')}`,
        }
      );
    }

    days.push({ dayNumber, theme, activities });
  }

  return {
    destination,
    durationDays,
    budgetTotal: budget,
    travelStyle: 'balanced',
    days,
    fairExpenseEstimate: {
      stay: Math.round(budget * 0.4),
      transport: Math.round(budget * 0.2),
      food: Math.round(budget * 0.25),
      activities: Math.round(budget * 0.15),
    },
    scamAlerts: [
      `Inquire about prepaid taxi/auto booths at ${destination} arrivals to avoid unmetered charges.`,
      `Always check official monument ticket counters or website before engaging unauthorized local guides.`,
    ],
  };
}

/**
 * Main AI Orchestrator Function:
 * Loops through Tier 1 (Gemini) -> Tier 2 (Groq) -> Tier 3 (Hugging Face) -> Tier 4 (Kaggle).
 * Validates inputs against strict schema (type, length, format) and rejects anything invalid.
 */
export async function generateItineraryAI(options: GenerateOptions): Promise<ItineraryPlan> {
  // Validate input against strict schema: rejects invalid types, lengths, out-of-range bounds, or bad patterns
  const validatedOptions = ItineraryRequestSchema.parse({
    destination: options.destination,
    durationDays: options.durationDays,
    budget: options.budget,
    travelStyle: options.travelStyle,
    interests: options.interests ?? [],
  });

  const prompt = buildPrompt(validatedOptions);

  // ---------------------------------------------------------------------------
  // TIER 1: Google Gemini API
  // ---------------------------------------------------------------------------
  if (process.env.GEMINI_API_KEY) {
    for (const model of GEMINI_MODELS) {
      const text = await callGemini(model, prompt, process.env.GEMINI_API_KEY);
      if (text) {
        const validated = guardrailAndValidateResponse(text, validatedOptions.destination);
        if (validated) {
          console.log(`[AI Orchestrator] Successfully generated & guardrailed via Gemini (${model})`);
          return validated;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // TIER 2: Groq / Grok
  // ---------------------------------------------------------------------------
  const groqKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
  if (groqKey) {
    for (const model of GROQ_MODELS) {
      const text = await callGroq(model, prompt, groqKey);
      if (text) {
        const validated = guardrailAndValidateResponse(text, validatedOptions.destination);
        if (validated) {
          console.log(`[AI Orchestrator] Successfully generated & guardrailed via Groq (${model})`);
          return validated;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // TIER 3: Hugging Face (Qwen & DeepSeek)
  // ---------------------------------------------------------------------------
  if (process.env.HUGGINGFACE_API_KEY) {
    for (const model of HUGGINGFACE_MODELS) {
      const text = await callHuggingFace(model, prompt, process.env.HUGGINGFACE_API_KEY);
      if (text) {
        const validated = guardrailAndValidateResponse(text, validatedOptions.destination);
        if (validated) {
          console.log(`[AI Orchestrator] Successfully generated & guardrailed via Hugging Face (${model})`);
          return validated;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // TIER 4: Deterministic Kaggle Dataset Seed Engine
  // ---------------------------------------------------------------------------
  return generateDeterministicFallback(
    validatedOptions.destination,
    validatedOptions.durationDays,
    validatedOptions.budget
  );
}
