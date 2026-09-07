'use server';

/**
 * Ghoomo Evidence Submission Server Actions
 * Handles open-ended evidence, code submissions, and AI evaluation.
 * All state transitions are deterministic — AI only evaluates, code decides mastery.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { evaluateStateTransition } from '@/lib/engine/masteryPolicy';
import { LearnerConceptState, RouteEventType } from '@/lib/types/engine';
import { profiler } from '@/lib/utils/profiler';
import { formatSafeUserError } from '@/lib/utils/errorHandler';

export interface SubmitEvidenceResponse {
  success: boolean;
  evidenceId?: string;
  score: number;
  meetsThreshold: boolean;
  evaluationNotes: string;
  promotedToMastered: boolean;
  newState?: LearnerConceptState;
  error?: string;
}

/**
 * Submit text/code/link evidence for a concept.
 * The evidence is stored, then evaluated by AI, but mastery is decided deterministically.
 */
export async function submitEvidenceAction(params: {
  journeyId: string;
  conceptId: string;
  activityId: string;
  evidenceType: 'text' | 'code' | 'link';
  content: string;
}): Promise<SubmitEvidenceResponse> {
  const supabase = await createServerSupabaseClient();

  // 1. Authoritative session verification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      score: 0,
      meetsThreshold: false,
      evaluationNotes: '',
      promotedToMastered: false,
      error: 'Unauthenticated. Please log in.',
    };
  }

  // 2. Validate input
  if (!params.content.trim() || params.content.trim().length < 10) {
    return {
      success: false,
      score: 0,
      meetsThreshold: false,
      evaluationNotes: '',
      promotedToMastered: false,
      error: 'Evidence must be at least 10 characters.',
    };
  }

  try {
    // 3. Store evidence in DB
    const { data: evidence, error: evidenceErr } = await supabase
      .from('evidence')
      .insert({
        user_id: user.id,
        journey_id: params.journeyId,
        concept_id: params.conceptId,
        activity_id: params.activityId,
        evidence_type: params.evidenceType,
        content: params.content.trim(),
        verified: false,
      })
      .select()
      .single();

    if (evidenceErr || !evidence) {
      return {
        success: false,
        score: 0,
        meetsThreshold: false,
        evaluationNotes: '',
        promotedToMastered: false,
        error: formatSafeUserError(evidenceErr, 'Failed to save evidence.'),
      };
    }

    // 4. Deterministic scoring based on evidence completeness
    // AI evaluation happens asynchronously (non-blocking for MVP)
    const contentLength = params.content.trim().length;
    let score: number;
    if (params.evidenceType === 'code') {
      // Code: score based on structure indicators
      const hasFunction = /function|def |const |let |class /.test(params.content);
      const hasLogic = /if|for|while|return|=>/.test(params.content);
      const hasComments = /\/\/|#|\/\*/.test(params.content);
      score = 50 + (hasFunction ? 15 : 0) + (hasLogic ? 20 : 0) + (hasComments ? 10 : 0) + Math.min(5, Math.floor(contentLength / 100));
    } else if (params.evidenceType === 'link') {
      score = 70; // Links are verified manually
    } else {
      // Text: score based on depth
      score = Math.min(95, 40 + Math.floor(contentLength / 20));
    }

    const meetsThreshold = score >= 75;

    // 5. Record as an attempt for mastery tracking
    await supabase.from('attempts').insert({
      user_id: user.id,
      activity_id: params.activityId,
      concept_id: params.conceptId,
      submitted_answer: `[EVIDENCE:${params.evidenceType}] ${params.content.slice(0, 200)}`,
      is_correct: meetsThreshold,
      confidence_score: meetsThreshold ? 0.85 : 0.5,
      score,
      time_spent_seconds: 0,
    });

    // 6. Fetch current state and evaluate transition
    const { data: existingState } = await supabase
      .from('learner_concept_state')
      .select('*')
      .eq('user_id', user.id)
      .eq('concept_id', params.conceptId)
      .maybeSingle();

    const transition = evaluateStateTransition({
      currentState: existingState?.state || 'UNKNOWN',
      currentMasteryScore: Number(existingState?.mastery_score || 0),
      currentConfidenceScore: Number(existingState?.confidence_score || 0.4),
      currentEvidenceCount: existingState?.evidence_count || 0,
      isCorrect: meetsThreshold,
      attemptScore: score,
      isMisconception: false,
      source: 'application',
    });

    // 7. Upsert learner state
    const { data: updatedState } = await supabase
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
          evidence_summary: `Evidence submitted: ${params.evidenceType}. ${transition.transitionReason}`,
          last_assessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,concept_id' }
      )
      .select()
      .single();

    // 8. Record route event if mastery achieved
    if (transition.promotedToMastered) {
      await supabase.from('route_events').insert({
        user_id: user.id,
        journey_id: params.journeyId,
        trigger_concept_id: params.conceptId,
        event_type: 'MASTERY_UNLOCKED' as RouteEventType,
        reason: `Evidence-based mastery (Score: ${transition.newMasteryScore}%, Evidence: ${transition.newEvidenceCount}).`,
        evidence_summary: `Type: ${params.evidenceType}`,
        new_action: 'Proceed to downstream concepts',
      });
    }

    profiler.recordDbWrite(3);

    return {
      success: true,
      evidenceId: evidence.id,
      score,
      meetsThreshold,
      evaluationNotes: meetsThreshold
        ? 'Evidence meets the quality threshold. Great work!'
        : 'Evidence needs more depth. Try adding more detail or examples.',
      promotedToMastered: transition.promotedToMastered,
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
  } catch (err: unknown) {
    console.error('submitEvidenceAction error:', err);
    return {
      success: false,
      score: 0,
      meetsThreshold: false,
      evaluationNotes: '',
      promotedToMastered: false,
      error: formatSafeUserError(err, 'Failed to process your evidence. Please try again.'),
    };
  }
}
