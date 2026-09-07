'use server';

/**
 * Ghoomo Server Actions for AI Operations
 * Executes Gemini calls strictly on the Node.js server where GEMINI_API_KEY is available.
 * Keeps secret credentials out of client-side browser bundles.
 */

import {
  generateGoalIntakeBlueprint,
  analyzeMisconceptionCandidate,
  askCopilotGuidedInquiry,
  extractResourceConcepts,
} from '@/lib/ai/geminiClient';
import {
  CandidateGoalBlueprint,
  CandidateMisconception,
  CandidateResourceExtraction,
} from '@/lib/ai/schemas';
import {
  CreateGoalInputSchema,
  CopilotInquiryInputSchema,
} from '@/schemas/inputSchemas';
import { formatSafeUserError } from '@/lib/utils/errorHandler';
import { z } from 'zod';

const GoalBlueprintRequestSchema = z.object({
  goalTitle: z.string().trim().min(2, 'Goal title must be at least 2 characters').max(120),
  targetDomain: z.string().trim().min(2, 'Domain must be at least 2 characters').max(60),
  preferredModality: z.string().trim().min(2).max(30).default('interactive').optional(),
  learningReason: z.string().trim().max(100).optional(),
  targetCompetency: z.string().trim().max(150).optional(),
  declaredLevel: z.enum(['beginner', 'intermediate', 'advanced', 'not_sure']).default('intermediate').optional(),
}).strict();

export async function generateGoalIntakeBlueprintAction(params: {
  goalTitle: string;
  targetDomain: string;
  preferredModality?: string;
  learningReason?: string;
  targetCompetency?: string;
  declaredLevel?: 'beginner' | 'intermediate' | 'advanced' | 'not_sure';
}): Promise<{ success: true; data: CandidateGoalBlueprint } | { success: false; error: string }> {
  // 1. Strict schema validation
  const validation = GoalBlueprintRequestSchema.safeParse(params);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid learning goal parameters.',
    };
  }

  try {
    return await generateGoalIntakeBlueprint(validation.data);
  } catch (err: any) {
    console.error('[AI Action Error] generateGoalIntakeBlueprintAction:', err);
    return {
      success: false,
      error: formatSafeUserError(err, 'Unable to design your course roadmap right now. Please try again.'),
    };
  }
}

export async function analyzeMisconceptionCandidateAction(params: {
  conceptName: string;
  questionText: string;
  submittedAnswer: string;
  correctAnswer: string;
  explanation: string;
}): Promise<{ success: true; data: CandidateMisconception } | { success: false; error: string }> {
  if (!params.conceptName || !params.submittedAnswer) {
    return { success: false, error: 'Invalid question analysis request.' };
  }

  try {
    return await analyzeMisconceptionCandidate(params);
  } catch (err: any) {
    console.error('[AI Action Error] analyzeMisconceptionCandidateAction:', err);
    return {
      success: false,
      error: formatSafeUserError(err, 'Unable to complete learning diagnosis.'),
    };
  }
}

export async function askCopilotGuidedInquiryAction(params: {
  goalTitle: string;
  conceptName: string;
  learnerState: string;
  activityTitle: string;
  detectedMisconception?: string | null;
  userQuery: string;
  preferredLanguage?: string;
}): Promise<{ success: true; reply: string } | { success: false; error: string }> {
  // 1. Strict schema validation
  const validation = CopilotInquiryInputSchema.safeParse(params);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid question format.',
    };
  }

  try {
    return await askCopilotGuidedInquiry(validation.data);
  } catch (err: any) {
    console.error('[AI Action Error] askCopilotGuidedInquiryAction:', err);
    return {
      success: false,
      error: formatSafeUserError(err, 'Copilot is currently unavailable. Please try again shortly.'),
    };
  }
}

export async function extractResourceConceptsAction(params: {
  resourceText: string;
  resourceTitle: string;
}): Promise<{ success: true; data: CandidateResourceExtraction } | { success: false; error: string }> {
  if (!params.resourceTitle?.trim() || !params.resourceText?.trim()) {
    return { success: false, error: 'Resource title and content are required.' };
  }

  try {
    return await extractResourceConcepts(params);
  } catch (err: any) {
    console.error('[AI Action Error] extractResourceConceptsAction:', err);
    return {
      success: false,
      error: formatSafeUserError(err, 'Unable to analyze learning resource.'),
    };
  }
}
