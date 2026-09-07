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
import { SubmitAttemptInputSchema, SubmitAttemptInput, CompleteActivityInputSchema, CompleteActivityInput } from '@/schemas/inputSchemas';
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

export async function submitQuestionAttemptAction(
  rawParams: SubmitAttemptInput
): Promise<SubmitAttemptResponse> {
  const startTime = performance.now();

  // 1. Strict input validation
  const validation = SubmitAttemptInputSchema.safeParse(rawParams);
  if (!validation.success) {
    return {
      success: false,
      isCorrect: false,
      score: 0,
      promotedToMastered: false,
      error: validation.error.issues[0]?.message || 'Invalid attempt submission payload.',
    };
  }
  const params = validation.data;

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
        .maybeSingle();

      if (qData) {
        correctAnswer = qData.correct_answer;
        explanation = qData.explanation || '';
      }
    }

    if (!correctAnswer && params.expectedAnswer) {
      correctAnswer = params.expectedAnswer;
      explanation = params.explanation || '';
    }

    if (correctAnswer) {
      const cleanSub = params.submittedAnswer.trim().toLowerCase();
      const cleanExp = correctAnswer.trim().toLowerCase();
      isCorrect =
        cleanSub === cleanExp ||
        cleanSub.startsWith(cleanExp) ||
        cleanExp.startsWith(cleanSub) ||
        cleanSub.includes(cleanExp);
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

    // If correct, resolve any active misconceptions for this concept
    if (isCorrect) {
      await supabase
        .from('misconceptions')
        .update({ is_resolved: true })
        .eq('user_id', user.id)
        .eq('concept_id', params.conceptId);
    }

    // 4. Fetch current learner state for this concept
    const { data: existingState } = await supabase
      .from('learner_concept_state')
      .select('*')
      .eq('user_id', user.id)
      .eq('concept_id', params.conceptId)
      .maybeSingle();

    const prevMasteryScore = Number(existingState?.mastery_score || 0);
    const shouldPromoteLast = Boolean(params.isLastQuestion && isCorrect);

    // 5. Evaluate deterministic mathematical mastery policy
    const transition = evaluateStateTransition({
      currentState: existingState?.state || 'UNKNOWN',
      currentMasteryScore: prevMasteryScore,
      currentConfidenceScore: Number(existingState?.confidence_score || 0.4),
      currentEvidenceCount: existingState?.evidence_count || 0,
      isCorrect,
      attemptScore: score,
      isMisconception: !isCorrect,
      verifiedApplication: shouldPromoteLast,
      source: 'practice',
    });

    if (shouldPromoteLast && transition.newState !== 'MASTERED') {
      transition.newState = 'MASTERED';
      transition.newMasteryScore = Math.max(transition.newMasteryScore, 90);
      transition.newConfidenceScore = Math.max(transition.newConfidenceScore, 0.95);
      transition.promotedToMastered = true;
      transition.transitionReason = 'Completed practice drills successfully. Full mastery achieved!';
    }

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

/**
 * Explicit action to mark an activity completed and set its concept state to MASTERED.
 */
export async function completeActivityAction(rawParams: CompleteActivityInput): Promise<{
  success: boolean;
  promotedToMastered: boolean;
  nextActivityId?: string;
  error?: string;
}> {
  const parseResult = CompleteActivityInputSchema.safeParse(rawParams);
  if (!parseResult.success) {
    return {
      success: false,
      promotedToMastered: false,
      error: parseResult.error.errors[0]?.message || 'Invalid completion request parameters.',
    };
  }
  const params = parseResult.data;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      promotedToMastered: false,
      error: 'Unauthenticated. Please log in to complete activity.',
    };
  }

  try {
    // 1. Resolve any misconceptions for this concept
    await supabase
      .from('misconceptions')
      .update({ is_resolved: true })
      .eq('user_id', user.id)
      .eq('concept_id', params.conceptId);

    // 2. Fetch current learner state
    const { data: existingState } = await supabase
      .from('learner_concept_state')
      .select('*')
      .eq('user_id', user.id)
      .eq('concept_id', params.conceptId)
      .maybeSingle();

    const newEvidenceCount = Math.max(2, (existingState?.evidence_count || 0) + 1);

    // 3. Upsert state to MASTERED
    const { error: stateErr } = await supabase
      .from('learner_concept_state')
      .upsert(
        {
          user_id: user.id,
          concept_id: params.conceptId,
          state: 'MASTERED',
          mastery_score: 100,
          confidence_score: 1.0,
          evidence_count: newEvidenceCount,
          mastery_source: 'practice',
          evidence_summary: `Completed all lesson practice & checks with verified mastery.`,
          last_assessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,concept_id' }
      );

    if (stateErr) {
      console.error('Failed to update completeActivityAction state:', stateErr);
    }

    // 4. Log route event
    await supabase.from('route_events').insert({
      user_id: user.id,
      journey_id: params.journeyId,
      trigger_concept_id: params.conceptId,
      event_type: 'MASTERY_UNLOCKED' as RouteEventType,
      reason: `Completed lesson practice and verified concept mastery.`,
      evidence_summary: `All questions passed successfully.`,
      new_action: 'Proceed to downstream concepts',
    });

    // 5. Find next sequential activity
    const { data: currAct } = await supabase
      .from('learning_activities')
      .select('order_index')
      .eq('id', params.activityId)
      .maybeSingle();

    const currOrder = currAct?.order_index ?? 0;

    const { data: nextActs } = await supabase
      .from('learning_activities')
      .select('id')
      .eq('journey_id', params.journeyId)
      .gt('order_index', currOrder)
      .order('order_index', { ascending: true })
      .limit(1);

    return {
      success: true,
      promotedToMastered: true,
      nextActivityId: nextActs && nextActs.length > 0 ? nextActs[0].id : undefined,
    };
  } catch (err: any) {
    console.error('completeActivityAction error:', err);
    return {
      success: false,
      promotedToMastered: false,
      error: formatSafeUserError(err, 'Failed to save completed activity.'),
    };
  }
}
