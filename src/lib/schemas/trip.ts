import { z } from 'zod';

export const createTripSchema = z.object({
  title: z.string().min(3, 'Trip title must be at least 3 characters').max(60, 'Trip title is too long'),
  destinationRegion: z.string().min(2, 'Please select or enter an Indian destination'),
  startDate: z.string().optional(),
  durationDays: z.coerce.number().min(1, 'Minimum 1 day').max(14, 'Maximum 14 days for hackathon MVP'),
  budgetTotal: z.coerce.number().min(1000, 'Minimum budget is ₹1,000'),
  travelStyle: z.enum(['solo', 'couple', 'friends', 'family']),
  initialSocialUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export type CreateTripFormValues = z.infer<typeof createTripSchema>;

export const socialImportSchema = z.object({
  url: z.string().url('Please enter a valid social URL (Instagram, TikTok, YouTube, or Blog)'),
});

export type SocialImportFormValues = z.infer<typeof socialImportSchema>;

export const addPlaceSchema = z.object({
  name: z.string().min(2, 'Place name is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  category: z.string().default('attraction'),
  confidence: z.coerce.number().min(0).max(1).default(1.0),
  notes: z.string().optional(),
  assignedDay: z.coerce.number().optional(),
});

export type AddPlaceFormValues = z.infer<typeof addPlaceSchema>;

export const budgetItemSchema = z.object({
  category: z.enum(['stay', 'transport', 'food', 'activity', 'shopping', 'other']),
  description: z.string().min(2, 'Description is required'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  isPaid: z.boolean().default(false),
});

export type BudgetItemFormValues = z.infer<typeof budgetItemSchema>;

export const checklistItemSchema = z.object({
  category: z.enum(['packing', 'booking', 'documents', 'gear', 'other']),
  title: z.string().min(2, 'Checklist item cannot be empty'),
  assignedTo: z.string().optional(),
});

export type ChecklistItemFormValues = z.infer<typeof checklistItemSchema>;
