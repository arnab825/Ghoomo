import { z } from 'zod';

export const listingFilterSchema = z.object({
  city: z.string().optional(),
  category: z.enum(['all', 'homestay', 'artisan', 'guide', 'experience']).default('all'),
  maxPrice: z.coerce.number().optional(),
  onlyVerified: z.boolean().default(true),
});

export type ListingFilterInput = z.infer<typeof listingFilterSchema>;

export const inquirySchema = z.object({
  listingId: z.string().min(1),
  listingTitle: z.string().min(1),
  guestName: z.string().min(2, 'Name must be at least 2 characters'),
  guestEmail: z.string().email('Please enter a valid email address'),
  guestPhone: z.string().min(10, 'Please enter a valid 10-digit phone number'),
  dates: z.string().min(3, 'Please specify intended dates'),
  guestsCount: z.coerce.number().min(1, 'At least 1 guest required').max(20),
  message: z.string().optional(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
