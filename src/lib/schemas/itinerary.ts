import { z } from 'zod';

export const itineraryQuerySchema = z.object({
  city: z.string().min(2, 'City is required'),
  days: z.coerce.number().min(1).max(14).default(3),
  budget: z.coerce.number().min(1000).default(12000),
  style: z.enum(['budget', 'balanced', 'luxury', 'cultural', 'adventure']).default('balanced'),
  interests: z.string().optional(),
});

export type ItineraryQueryInput = z.infer<typeof itineraryQuerySchema>;

export const rerouteSchema = z.object({
  city: z.string().min(2),
  condition: z.enum(['rain', 'extreme_heat', 'traffic_congestion', 'crowd_surge']),
  currentItinerary: z.any(),
});

export type RerouteInput = z.infer<typeof rerouteSchema>;
