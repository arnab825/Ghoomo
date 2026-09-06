'use server';

import {
  GenerateJourneyParams,
  CopilotContext,
  LearningJourney,
} from '@/lib/types/learning';
import {
  generateLearningJourney,
  askLearningCopilot,
  evaluateStudentReflection,
} from '@/lib/ai/learningEngine';

export async function createLearningJourneyAction(
  params: GenerateJourneyParams
): Promise<{ success: boolean; data?: LearningJourney; error?: string }> {
  try {
    if (!params.topicOrUrl || params.topicOrUrl.trim() === '') {
      return { success: false, error: 'Please enter a learning topic, curriculum subject, or educational URL.' };
    }

    const journey = await generateLearningJourney(params);
    return { success: true, data: journey };
  } catch (err: unknown) {
    console.error('[createLearningJourneyAction] Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unable to generate learning journey. Please try again.',
    };
  }
}

export async function askLearningCopilotAction(
  context: CopilotContext
): Promise<{ success: boolean; answer?: string; error?: string }> {
  try {
    const answer = await askLearningCopilot(context);
    return { success: true, answer };
  } catch (err: unknown) {
    console.error('[askLearningCopilotAction] Error:', err);
    return {
      success: false,
      error: 'Learning Copilot is currently recalibrating. Please ask again in a moment.',
    };
  }
}

export async function evaluateReflectionAction(
  prompt: string,
  studentResponse: string,
  gradeLevel: string
): Promise<{ success: boolean; feedback?: string; score?: number; error?: string }> {
  try {
    const evaluation = await evaluateStudentReflection(prompt, studentResponse, gradeLevel);
    return { success: true, feedback: evaluation.feedback, score: evaluation.score };
  } catch (err: unknown) {
    console.error('[evaluateReflectionAction] Error:', err);
    return {
      success: false,
      error: 'Unable to evaluate reflection at this time.',
    };
  }
}
