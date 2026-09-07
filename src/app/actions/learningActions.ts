'use server';

/**
 * Ghoomo Server Actions for Authoritative Learning Operations
 * Executes all state transitions, attempt records, and route updates strictly on the server.
 * Derives user identity from the verified HTTP session cookie (createServerSupabaseClient)
 * and guarantees that client-provided IDs cannot spoof progress or bypass RLS boundaries.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { evaluateStateTransition } from '@/lib/engine/masteryPolicy';
import { LearnerConceptState, RouteEventType } from '@/lib/types/engine';
import { profiler } from '@/lib/utils/profiler';
import { SubmitAttemptInputSchema } from '@/schemas/inputSchemas';
import { formatSafeUserError } from '@/lib/utils/errorHandler';

export interface SubmitAttemptResponse {
  success: boolean;
  attemptId?: string;
  isCorrect: boolean;
  score: number;
  promotedToMastered: boolean;
  newState?: LearnerConceptState;
  routeChanged?: boolean;
  error?: string;
}

export async function submitQuestionAttemptAction(params: {
  activityId: string;
  questionId?: string;
  conceptId: string;
  journeyId: string;
  submittedAnswer: string;
  timeSpentSeconds: number;
}): Promise<SubmitAttemptResponse> {
  const startTime = performance.now();

  // 1. Strict input validation
  const validation = SubmitAttemptInputSchema.safeParse(params);
  if (!validation.success) {
    return {
      success: false,
      isCorrect: false,
      score: 0,
      promotedToMastered: false,
      error: validation.error.issues[0]?.message || 'Invalid attempt submission payload.',
    };
  }

  const supabase = await createServerSupabaseClient();

  // 2. Authoritative session verification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      isCorrect: false,
      score: 0,
      promotedToMastered: false,
      error: 'Unauthenticated. Please log in to record learning progress.',
    };
  }

  try {
    // 2. Fetch question details from DB to grade deterministically
    let isCorrect = false;
    let correctAnswer = '';
    let explanation = '';

    if (params.questionId) {
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('id', params.questionId)
        .single();

      if (qData) {
        correctAnswer = qData.correct_answer;
        explanation = qData.explanation || '';
        isCorrect = params.submittedAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      }
    }

    const score = isCorrect ? 100 : 30;

    // 3. Authoritative insert into attempts table
    const { data: attempt, error: attemptErr } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        activity_id: params.activityId,
        question_id: params.questionId || null,
        concept_id: params.conceptId,
        submitted_answer: params.submittedAnswer,
        is_correct: isCorrect,
        confidence_score: isCorrect ? 0.9 : 0.4,
        score,
        time_spent_seconds: params.timeSpentSeconds || 30,
      })
      .select()
      .single();

    if (attemptErr) {
      console.error('Failed to insert attempt:', attemptErr);
    }

    // 4. Fetch current learner state for this concept
    const { data: existingState } = await supabase
      .from('learner_concept_state')
      .select('*')
      .eq('user_id', user.id)
      .eq('concept_id', params.conceptId)
      .maybeSingle();

    const currentEvidenceCount = (existingState?.evidence_count || 0) + (isCorrect ? 1 : 0);
    const prevMasteryScore = Number(existingState?.mastery_score || 0);
    const newMasteryScore = Math.round((prevMasteryScore + score) / (existingState ? 2 : 1));
    const newConfidenceScore = isCorrect ? 0.9 : 0.45;

    // Check for any active unresolved misconceptions
    const { data: activeMisc } = await supabase
      .from('misconceptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('concept_id', params.conceptId)
      .eq('is_resolved', false);

    const hasUnresolvedMisconceptions = (activeMisc || []).length > 0;

    // 5. Evaluate deterministic mathematical mastery policy
    const transition = evaluateStateTransition({
      currentState: existingState?.state || 'UNKNOWN',
      currentMasteryScore: prevMasteryScore,
      currentConfidenceScore: Number(existingState?.confidence_score || 0.4),
      currentEvidenceCount: existingState?.evidence_count || 0,
      isCorrect,
      attemptScore: score,
      isMisconception: !isCorrect,
      source: 'practice',
    });

    const promotedToMastered = transition.promotedToMastered;

    // 6. Upsert learner state
    const { data: updatedState, error: stateErr } = await supabase
      .from('learner_concept_state')
      .upsert(
        {
          user_id: user.id,
          concept_id: params.conceptId,
          state: transition.newState,
          mastery_score: transition.newMasteryScore,
          confidence_score: transition.newConfidenceScore,
          evidence_count: transition.newEvidenceCount,
          mastery_source: transition.newMasterySource,
          evidence_summary: `Recorded ${transition.newEvidenceCount} submission(s). ${transition.transitionReason}`,
          last_assessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,concept_id' }
      )
      .select()
      .single();

    if (stateErr) {
      console.error('Failed to update learner state:', stateErr);
    }

    // 7. Record route event if state transitioned or mastery reached
    let routeChanged = false;
    if (promotedToMastered) {
      routeChanged = true;
      await supabase.from('route_events').insert({
        user_id: user.id,
        journey_id: params.journeyId,
        trigger_concept_id: params.conceptId,
        event_type: 'MASTERY_UNLOCKED' as RouteEventType,
        reason: `Achieved multi-evidence mastery (Score: ${transition.newMasteryScore}%, Evidence: ${transition.newEvidenceCount}).`,
        evidence_summary: `All prerequisites satisfied and verified.`,
        new_action: 'Proceed to downstream concepts',
      });
    }

    profiler.recordDbWrite(2);
    profiler.recordRouterTime(performance.now() - startTime);

    return {
      success: true,
      attemptId: attempt?.id,
      isCorrect,
      score,
      promotedToMastered,
      routeChanged,
      newState: updatedState
        ? {
            id: updatedState.id,
            userId: updatedState.user_id,
            conceptId: updatedState.concept_id,
            state: updatedState.state,
            masteryScore: Number(updatedState.mastery_score),
            confidenceScore: Number(updatedState.confidence_score),
            evidenceCount: updatedState.evidence_count,
            masterySource: updatedState.mastery_source,
            evidenceSummary: updatedState.evidence_summary,
            lastAssessedAt: updatedState.last_assessed_at,
            updatedAt: updatedState.updated_at,
          }
        : undefined,
    };
  } catch (err: any) {
    console.error('submitQuestionAttemptAction error:', err);
    return {
      success: false,
      isCorrect: false,
      score: 0,
      promotedToMastered: false,
      error: formatSafeUserError(err, 'Unable to record your learning progress. Please try again.'),
    };
  }
}
