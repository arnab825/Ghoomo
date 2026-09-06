import { z } from 'zod';

export const authCredentialsSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['tourist', 'vendor', 'admin']),
  fullName: z.string().optional(),
});

export type AuthCredentialsInput = z.infer<typeof authCredentialsSchema>;
