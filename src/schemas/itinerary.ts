import { z } from 'zod';
import fairRatesData from '@/data/fair-rates.json';

/**
 * Strict Input Security Check:
 * Rejects prompt injection patterns, scripts, and SQL/eval payloads.
 * Beginner Note: Instead of silently stripping bad strings, we reject them immediately
 * so attackers cannot bypass security with disguised text.
 */
const FORBIDDEN_SECURITY_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s+prompt/i,
  /you\s+are\s+now\s+a/i,
  /dan\s+mode/i,
  /jailbreak/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[INST\]/i,
  /<script[\s\S]*?>/i,
  /<\/script>/i,
  /<iframe/i,
  /drop\s+table/i,
  /union\s+select/i,
  /eval\s*\(/i,
  /exec\s*\(/i,
  /javascript\s*:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /document\.cookie/i,
];

export function isStrictlySafeInput(val: string): boolean {
  if (typeof val !== 'string') return false;
  return !FORBIDDEN_SECURITY_PATTERNS.some((pattern) => pattern.test(val));
}

/**
 * Strict Destination Schema:
 * Validates type (string), length (2-60 chars), format (alphanumeric, spaces, basic punctuation),
 * and rejects forbidden script/injection patterns.
 */
export const DestinationInputSchema = z.string({
    required_error: 'Destination is required',
    invalid_type_error: 'Destination must be a string',
  })
  .trim()
  .min(2, 'Destination must be at least 2 characters long')
  .max(60, 'Destination cannot exceed 60 characters')
  .regex(
    /^[a-zA-Z0-9\s,.'-]+$/,
    'Destination must contain only letters, numbers, spaces, and basic punctuation (, . \' -)'
  )
  .refine(isStrictlySafeInput, {
    message: 'Destination contains forbidden injection or script patterns',
  });

// -----------------------------------------------------------------------------
// Output Sanitization Helpers (for LLM generated outputs)
// -----------------------------------------------------------------------------
function parseNumberSafely(value: unknown, fallback: number): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    const parsed = parseInt(digitsOnly, 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function parseBooleanSafely(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes';
  }
  return false;
}

function parseStringSafely(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (value !== undefined && value !== null) {
    return String(value);
  }
  return fallback;
}

// -----------------------------------------------------------------------------
// Output Activity Item Schema (Validating LLM outputs)
// -----------------------------------------------------------------------------
export const ActivityItemSchema = z.object({
  time: z.preprocess((v) => parseStringSafely(v, '09:00 AM - 12:00 PM'), z.string().default('09:00 AM - 12:00 PM')),
  title: z.preprocess((v) => parseStringSafely(v, 'Cultural Heritage Landmark'), z.string().default('Cultural Heritage Landmark')),
  location: z.preprocess((v) => parseStringSafely(v, 'City Center'), z.string().default('City Center')),
  type: z.preprocess((v) => parseStringSafely(v, 'heritage'), z.string().default('heritage')),
  estimatedCost: z.preprocess((v) => parseNumberSafely(v, 200), z.coerce.number().default(200)),
  description: z.preprocess((v) => parseStringSafely(v, 'Historic landmark visit.'), z.string().default('Historic landmark visit.')),
  etiquetteTip: z.string().optional(),
  isIndoor: z.preprocess(parseBooleanSafely, z.boolean().default(false)),
  imageUrl: z.string().optional(),
  googleMapsUrl: z.string().optional(),
});

// -----------------------------------------------------------------------------
// Output Itinerary Day Schema
// -----------------------------------------------------------------------------
export const ItineraryDaySchema = z.object({
  dayNumber: z.coerce.number().default(1),
  theme: z.preprocess((v) => parseStringSafely(v, 'Heritage and Culture'), z.string().default('Heritage and Culture')),
  activities: z.array(ActivityItemSchema).min(1, 'Each day must have at least one activity'),
});

// -----------------------------------------------------------------------------
// Complete Itinerary Plan Schema (LLM Output)
// -----------------------------------------------------------------------------
export const ItineraryPlanSchema = z.object({
  destination: z.string().default('India'),
  durationDays: z.coerce.number().default(3),
  budgetTotal: z.coerce.number().default(12000),
  travelStyle: z.string().default('balanced'),
  days: z.array(ItineraryDaySchema).min(1),
  fairExpenseEstimate: z.preprocess(
    (val: any) => {
      if (!val || typeof val !== 'object') {
        return { stay: 4800, transport: 2400, food: 3000, activities: 1800 };
      }
      return {
        stay: parseNumberSafely(val.stay, 4800),
        transport: parseNumberSafely(val.transport, 2400),
        food: parseNumberSafely(val.food, 3000),
        activities: parseNumberSafely(val.activities, 1800),
      };
    },
    z.object({
      stay: z.coerce.number().default(4800),
      transport: z.coerce.number().default(2400),
      food: z.coerce.number().default(3000),
      activities: z.coerce.number().default(1800),
    }).default({ stay: 4800, transport: 2400, food: 3000, activities: 1800 })
  ),
  scamAlerts: z.preprocess(
    (val) => (Array.isArray(val) ? val.map(String) : []),
    z.array(z.string()).default([])
  ),
});

// -----------------------------------------------------------------------------
// Strict Input Request Schemas: Type, Length, Format, and Strict Validation
// -----------------------------------------------------------------------------

/**
 * Strict Itinerary Request Schema
 * Validates destination, durationDays, budget, travelStyle, and interests.
 * Rejects extra unrecognized properties with .strict().
 */
export const ItineraryRequestSchema = z.object({
  destination: DestinationInputSchema,
  durationDays: z.number({
      required_error: 'durationDays is required',
      invalid_type_error: 'durationDays must be a number',
    })
    .int('durationDays must be an integer')
    .min(1, 'durationDays must be at least 1 day')
    .max(14, 'durationDays cannot exceed 14 days'),
  budget: z.number({
      required_error: 'budget is required',
      invalid_type_error: 'budget must be a number',
    })
    .int('budget must be an integer')
    .min(1000, 'budget must be at least ₹1,000')
    .max(1000000, 'budget cannot exceed ₹10,00,000'),
  travelStyle: z.enum(
    ['budget', 'balanced', 'luxury', 'cultural', 'family', 'tight', 'relaxed'],
    {
      errorMap: () => ({
        message: 'travelStyle must be one of: budget, balanced, luxury, cultural, family, tight, relaxed',
      }),
    }
  ),
  interests: z.array(
    z.string({ invalid_type_error: 'Each interest must be a string' })
      .trim()
      .min(2, 'Interest must be at least 2 characters')
      .max(40, 'Interest cannot exceed 40 characters')
      .regex(/^[a-zA-Z0-9\s-]+$/, 'Interest must contain only letters, numbers, and hyphens')
      .refine(isStrictlySafeInput, { message: 'Interest contains forbidden patterns' })
  )
  .max(10, 'Maximum 10 interests allowed')
  .default([]),
}).strict();

export type ItineraryRequest = z.infer<typeof ItineraryRequestSchema>;
export type ItineraryPlanValidated = z.infer<typeof ItineraryPlanSchema>;

/**
 * Strict Dynamic Reroute Request Schema
 * Rejects invalid reasons, formats, and unrecognized properties.
 */
export const DynamicRerouteSchema = z.object({
  destination: DestinationInputSchema,
  reason: z.enum(['rain', 'delay', 'crowd', 'heatwave'], {
    errorMap: () => ({ message: 'reason must be one of: rain, delay, crowd, heatwave' }),
  }),
  currentDay: z.number({
      required_error: 'currentDay is required',
      invalid_type_error: 'currentDay must be a number',
    })
    .int('currentDay must be an integer')
    .min(1, 'currentDay must be at least 1')
    .max(14, 'currentDay cannot exceed 14'),
  currentTime: z.string({
      required_error: 'currentTime is required',
      invalid_type_error: 'currentTime must be a string',
    })
    .trim()
    .regex(/^([01]?\d|2[0-3]):[0-5]\d(\s*(AM|PM))?$/i, 'currentTime must be in HH:MM or HH:MM AM/PM format'),
  currentActivityTitle: z.string({
      required_error: 'currentActivityTitle is required',
      invalid_type_error: 'currentActivityTitle must be a string',
    })
    .trim()
    .min(2, 'currentActivityTitle must be at least 2 characters')
    .max(100, 'currentActivityTitle cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s,.'()&-]+$/, 'currentActivityTitle contains invalid characters')
    .refine(isStrictlySafeInput, { message: 'currentActivityTitle contains forbidden patterns' }),
}).strict();

export type DynamicRerouteRequest = z.infer<typeof DynamicRerouteSchema>;

const SUPPORTED_FAIR_CITIES = Object.keys(fairRatesData.cities);

/**
 * Strict Scam Shield Query Schema
 * Validates city name format and km distance bounds.
 * Rejects unsupported cities, out-of-range numbers, and unrecognized query params.
 */
export const ScamShieldRequestSchema = z.object({
  city: z.string({
      required_error: 'City parameter is required',
      invalid_type_error: 'City must be a string',
    })
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'City must contain only letters, spaces, and hyphens')
    .refine(isStrictlySafeInput, { message: 'City contains forbidden injection patterns' })
    .refine(
      (val) => SUPPORTED_FAIR_CITIES.some((c) => c.toLowerCase() === val.toLowerCase()),
      {
        message: `City must be one of the supported cities: ${SUPPORTED_FAIR_CITIES.join(', ')}`,
      }
    )
    .transform((val) => {
      const canonical = SUPPORTED_FAIR_CITIES.find((c) => c.toLowerCase() === val.toLowerCase());
      return canonical || val;
    }),
  km: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = Number(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    },
    z.number({
      required_error: 'Distance (km) is required',
      invalid_type_error: 'Distance (km) must be a valid number',
    })
    .min(0.5, 'Distance must be at least 0.5 km')
    .max(500, 'Distance cannot exceed 500 km')
  ),
}).strict();

export type ScamShieldRequest = z.infer<typeof ScamShieldRequestSchema>;
