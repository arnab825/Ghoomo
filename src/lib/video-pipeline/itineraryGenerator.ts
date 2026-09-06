// ============================================================================
// Itinerary Generator (Gemini AI Call 2 + Deterministic Guardrail)
// Specification Section 18:
// - Takes the deterministically optimized schedule
// - Preserves exact geographic sequence and creator places
// - Marks provenance (creator vs AI)
// - Formats morning, afternoon, evening slots, meal suggestions, practical notes
// ============================================================================

import { ScheduledDay } from './geoOptimizer';
import { ProvenanceSource, PipelinePreferences } from '../types/travelVideoPipeline';
import { GeminiMultimodalService } from './geminiMultimodalService';

export interface GeneratedDayPlan {
  dayNumber: number;
  theme: string;
  date?: string;
  summary: string;
  mealSuggestions: {
    lunch?: string;
    dinner?: string;
  };
  practicalNote: string;
  items: Array<{
    name: string;
    canonicalName: string;
    timeSlot: 'morning' | 'afternoon' | 'evening';
    startTime: string;
    endTime: string;
    durationMinutes: number;
    travelMinutesFromPrevious: number;
    notes: string;
    provenance: ProvenanceSource;
    sourceType: 'creator' | 'ai' | 'user';
    lat: number;
    lng: number;
    city: string;
    state: string;
    category: string;
  }>;
}

export interface ItineraryGenerationResult {
  title: string;
  destination: string;
  durationDays: number;
  days: GeneratedDayPlan[];
  tierUsed: string;
}

export class ItineraryGenerator {
  /**
   * Primary generator: Gemini Call 2 with deterministic fallbacks
   */
  public static async generateFinalItinerary(
    destination: string,
    scheduledDays: ScheduledDay[],
    preferences: PipelinePreferences = {}
  ): Promise<ItineraryGenerationResult> {
    const model = GeminiMultimodalService.getTextModel();
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if we can invoke Gemini Call 2
    if (apiKey && !apiKey.includes('your-gemini')) {
      try {
        const prompt = `You are a travel itinerary writer.
Create the final travel itinerary using the supplied OPTIMIZED SCHEDULE.

Destination: "${destination}"
Duration: ${scheduledDays.length} Days
Pace: "${preferences.pace || 'balanced'}"
Interests: ${JSON.stringify(preferences.interests || ['sightseeing', 'culture', 'local food'])}

SUPPLIED OPTIMIZED SCHEDULE:
${JSON.stringify(
  scheduledDays.map((d) => ({
    day: d.dayNumber,
    theme: d.theme,
    places: d.places.map((p) => ({
      name: p.place.name,
      canonicalName: p.place.canonicalName || p.place.name,
      timeSlot: p.timeSlot,
      visitMins: p.estimatedVisitMinutes,
      transitMins: p.travelMinutesFromPrevious,
      provenance: p.provenance,
      lat: p.place.lat,
      lng: p.place.lng,
      city: p.place.city,
      state: p.place.state,
      category: p.place.type || 'sightseeing',
    })),
  })),
  null,
  2
)}

CRITICAL CONSTRAINTS:
1. Do NOT change the geographic order of places.
2. Do NOT add new cities or destinations not in the schedule.
3. Preserve all creator places with their exact provenance.
4. For each day provide:
   - "theme": Engaging day headline
   - "summary": Short evocative description of the day
   - "lunch": Authentic local dish/venue suggestion
   - "dinner": Atmospheric dinner or street food suggestion
   - "practicalNote": Realistic tip (e.g. ticketing, best lighting, dress code)
   - "items": Detailed itinerary stops with exact start/end times (e.g. "09:30" to "11:00")
5. Keep times realistic without overlapping or impossible transit.

Respond ONLY with valid JSON in this schema:
{
  "title": "Evocative Trip Title",
  "destination": "${destination}",
  "durationDays": ${scheduledDays.length},
  "days": [
    {
      "dayNumber": 1,
      "theme": "Theme headline",
      "summary": "Short summary",
      "mealSuggestions": {
        "lunch": "Local lunch recommendation",
        "dinner": "Dinner spot recommendation"
      },
      "practicalNote": "Practical travel advice",
      "items": [
        {
          "name": "Place Name",
          "canonicalName": "Canonical Place Name",
          "timeSlot": "morning | afternoon | evening",
          "startTime": "09:00",
          "endTime": "11:00",
          "durationMinutes": 120,
          "travelMinutesFromPrevious": 20,
          "notes": "Highlights and advice",
          "provenance": "creator_speech | creator_text | creator_visual | creator_multiple | ai_recommendation",
          "sourceType": "creator | ai",
          "lat": 0.0,
          "lng": 0.0,
          "city": "City",
          "state": "State",
          "category": "category"
        }
      ]
    }
  ]
}`;

        const rawJson = await GeminiMultimodalService.callGeminiWithRetry(
          model,
          [{ parts: [{ text: prompt }] }],
          apiKey
        );

        const parsed = JSON.parse(rawJson);
        if (parsed.days && Array.isArray(parsed.days) && parsed.days.length > 0) {
          return {
            title: parsed.title || `${destination} Travel Itinerary`,
            destination,
            durationDays: scheduledDays.length,
            days: parsed.days,
            tierUsed: `gemini_call2 (${model})`,
          };
        }
      } catch (err) {
        console.warn('[ItineraryGenerator] Gemini Call 2 notice (using deterministic fallback):', (err as Error).message);
      }
    }

    // Deterministic High-Quality Fallback (Zero LLM failure mode)
    return this.buildDeterministicPlan(destination, scheduledDays, preferences);
  }

  /**
   * Deterministic template generator guaranteed to never fail
   */
  public static buildDeterministicPlan(
    destination: string,
    scheduledDays: ScheduledDay[],
    preferences: PipelinePreferences = {}
  ): ItineraryGenerationResult {
    const days: GeneratedDayPlan[] = scheduledDays.map((day) => {
      let currentHour = 9; // 9:00 AM start

      const items = day.places.map((dp, idx) => {
        const startMins = currentHour * 60 + (idx === 0 ? 0 : dp.travelMinutesFromPrevious);
        const endMins = startMins + dp.estimatedVisitMinutes;

        const formatTime = (mins: number) => {
          const h = Math.floor(mins / 60) % 24;
          const m = mins % 60;
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        };

        const startTime = formatTime(startMins);
        const endTime = formatTime(endMins);
        currentHour = Math.floor(endMins / 60);

        const isCreator =
          dp.provenance.startsWith('creator_') || dp.place.provenance?.startsWith('creator_');

        return {
          name: dp.place.name,
          canonicalName: dp.place.canonicalName || dp.place.name,
          timeSlot: dp.timeSlot,
          startTime,
          endTime,
          durationMinutes: dp.estimatedVisitMinutes,
          travelMinutesFromPrevious: dp.travelMinutesFromPrevious,
          notes: dp.place.notes || `Scenic highlight at ${dp.place.name}`,
          provenance: dp.provenance || 'creator_multiple',
          sourceType: (isCreator ? 'creator' : 'ai') as 'creator' | 'ai',
          lat: dp.place.lat || 0,
          lng: dp.place.lng || 0,
          city: dp.place.city || destination,
          state: dp.place.state || '',
          category: dp.place.type || 'sightseeing',
        };
      });

      return {
        dayNumber: day.dayNumber,
        theme: day.theme,
        summary: `Explore ${day.places.map((p) => p.place.name).slice(0, 3).join(', ')} with optimal transit buffers.`,
        mealSuggestions: {
          lunch: `Authentic regional delicacies near ${day.places[0]?.place.name || destination}`,
          dinner: `Sunset dining and evening atmosphere in central ${day.places[day.places.length - 1]?.place.city || destination}`,
        },
        practicalNote: 'Comfortable walking footwear recommended; carry water and offline map pins.',
        items,
      };
    });

    return {
      title: `${scheduledDays.length}-Day ${destination} Curated Journey`,
      destination,
      durationDays: scheduledDays.length,
      days,
      tierUsed: 'deterministic_engine',
    };
  }
}
