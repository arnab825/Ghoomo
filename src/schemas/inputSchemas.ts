import { z } from 'zod';

/**
 * Production-Grade Input Validation Schemas
 * Rejects any non-conforming types, lengths, or formats strictly before execution.
 */

// ============================================================================
// 1. Authentication Schemas
// ============================================================================
export const LoginInputSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(254, 'Email cannot exceed 254 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters'),
}).strict();

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const SignupInputSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(254, 'Email cannot exceed 254 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(70, 'Full name cannot exceed 70 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Full name contains invalid characters'),
  role: z.enum(['learner', 'student']).default('learner'),
  preferredLanguage: z
    .string()
    .trim()
    .min(2, 'Language code must be at least 2 characters')
    .max(30, 'Language name cannot exceed 30 characters')
    .default('English'),
  learningModality: z
    .enum(['interactive', 'visual', 'reading', 'mixed'])
    .default('mixed'),
}).strict();

export type SignupInput = z.infer<typeof SignupInputSchema>;

export const ForgotPasswordInputSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(254, 'Email cannot exceed 254 characters'),
}).strict();

export const ResetPasswordInputSchema = z.object({
  password: z
    .string({ required_error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
}).strict();

// ============================================================================
// 2. Learning & Course Management Schemas
// ============================================================================
export const CreateGoalInputSchema = z.object({
  title: z
    .string({ required_error: 'Course goal title is required' })
    .trim()
    .min(3, 'Goal title must be at least 3 characters')
    .max(120, 'Goal title cannot exceed 120 characters')
    .regex(/^[^<>]+$/, 'Goal title cannot contain HTML or angle brackets'),
  targetDomain: z
    .string({ required_error: 'Target domain is required' })
    .trim()
    .min(2, 'Domain must be at least 2 characters')
    .max(60, 'Domain cannot exceed 60 characters'),
  dailyMinutes: z
    .number({ required_error: 'Daily study minutes are required' })
    .int('Study minutes must be a whole number')
    .min(5, 'Minimum study time is 5 minutes')
    .max(180, 'Maximum study time is 180 minutes')
    .default(30),
}).strict();

export type CreateGoalInput = z.infer<typeof CreateGoalInputSchema>;

export const SubmitAttemptInputSchema = z.object({
  activityId: z.string().uuid('Invalid activity identifier format'),
  questionId: z.string().uuid('Invalid question identifier format').optional().nullable(),
  conceptId: z.string().uuid('Invalid concept identifier format'),
  journeyId: z.string().uuid('Invalid journey identifier format'),
  submittedAnswer: z
    .string({ required_error: 'Submitted answer is required' })
    .trim()
    .min(1, 'Submitted answer cannot be empty')
    .max(1000, 'Answer cannot exceed 1000 characters'),
  timeSpentSeconds: z
    .number({ required_error: 'Time spent is required' })
    .int('Time spent must be an integer')
    .min(1, 'Time spent must be at least 1 second')
    .max(7200, 'Time spent cannot exceed 2 hours'),
}).strict();

export type SubmitAttemptInput = z.infer<typeof SubmitAttemptInputSchema>;

// ============================================================================
// 3. AI Copilot & Blueprint Schemas
// ============================================================================
export const CopilotInquiryInputSchema = z.object({
  goalTitle: z.string().trim().min(1, 'Goal title is required').max(150),
  conceptName: z.string().trim().min(1, 'Concept name is required').max(150),
  learnerState: z.string().trim().min(1).max(50),
  activityTitle: z.string().trim().min(1, 'Activity title is required').max(150),
  detectedMisconception: z.string().trim().max(200).optional().nullable(),
  userQuery: z
    .string({ required_error: 'Question is required' })
    .trim()
    .min(2, 'Question must be at least 2 characters')
    .max(300, 'Question cannot exceed 300 characters')
    .regex(/^[^<>]+$/, 'Question cannot contain HTML or angle brackets'),
  preferredLanguage: z.string().trim().max(30).optional().default('English'),
}).strict();

export type CopilotInquiryInput = z.infer<typeof CopilotInquiryInputSchema>;

// ============================================================================
// 4. Public Forms & Checkout Schemas
// ============================================================================
export const ContactFormInputSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(70, 'Name cannot exceed 70 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(254, 'Email cannot exceed 254 characters'),
  subject: z
    .string({ required_error: 'Subject is required' })
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(120, 'Subject cannot exceed 120 characters'),
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message cannot exceed 2000 characters'),
}).strict();

export type ContactFormInput = z.infer<typeof ContactFormInputSchema>;

export const RazorpayCheckoutInputSchema = z.object({
  planId: z.enum(['starter', 'pro', 'unlimited'], {
    errorMap: () => ({ message: 'Invalid subscription plan selected' }),
  }),
  amount: z
    .number()
    .int('Amount must be in whole units')
    .positive('Amount must be positive'),
  currency: z.literal('INR'),
}).strict();

export type RazorpayCheckoutInput = z.infer<typeof RazorpayCheckoutInputSchema>;
