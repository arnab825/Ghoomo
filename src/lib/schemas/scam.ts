import { z } from 'zod';

export const fairPriceQuerySchema = z.object({
  city: z.string().min(2, 'City is required'),
  distanceKm: z.coerce.number().min(0.5, 'Minimum distance is 0.5 km').max(100, 'Maximum distance is 100 km'),
  quotedPrice: z.coerce.number().min(1, 'Please enter the quoted price'),
  vehicleType: z.enum(['auto', 'prepaid_taxi']).default('auto'),
  isNight: z.boolean().default(false),
});

export type FairPriceQueryInput = z.infer<typeof fairPriceQuerySchema>;

export const scamAlertSchema = z.object({
  city: z.string().min(2, 'City is required'),
  category: z.enum(['transport', 'guides', 'shopping', 'temples', 'general']),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(15, 'Description must be at least 15 characters'),
  severity: z.enum(['info', 'warning', 'critical']),
  howToAvoid: z.string().min(10, 'Prevention advice is required'),
});

export type ScamAlertInput = z.infer<typeof scamAlertSchema>;
