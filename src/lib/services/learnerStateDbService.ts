import { supabase } from '@/lib/supabase/client';
import { LearnerConceptState, Misconception, Evidence, Attempt } from '../types/engine';
import { evaluateDiagnosticOutcome, evaluateStateTransition } from '../engine/masteryPolicy';

export async function getLearnerStates(
  userId: string,
  conceptIds: string[]
): Promise<Map<string, LearnerConceptState>> {
  const stateMap = new Map<string, LearnerConceptState>();
  if (conceptIds.length === 0) return stateMap;

  try {
    const { data, error } = await supabase
      .from('learner_concept_state')
      .select('*')
      .eq('user_id', userId)
      .in('concept_id', conceptIds);

    if (error || !data) return stateMap;

    for (const row of data) {
      stateMap.set(row.concept_id, {
        id: row.id,
        userId: row.user_id,
        conceptId: row.concept_id,
        state: row.state,
        masteryScore: Number(row.mastery_score || 0),
        confidenceScore: Number(row.confidence_score || 0),
        evidenceCount: row.evidence_count || 0,
        masterySource: row.mastery_source,
        evidenceSummary: row.evidence_summary,
        lastAssessedAt: row.last_assessed_at,
        updatedAt: row.updated_at,
      });
    }

    return stateMap;
  } catch {
    return stateMap;
  }
}

export async function initializeDiagnosticStates(params: {
  userId: string;
  conceptIdToIsCorrect: Map<string, boolean>;
}): Promise<void> {
  const rowsToUpsert: any[] = [];

  for (const [conceptId, isCorrect] of params.conceptIdToIsCorrect.entries()) {
    const diagOutcome = evaluateDiagnosticOutcome(isCorrect);
    rowsToUpsert.push({
      user_id: params.userId,
      concept_id: conceptId,
      state: diagOutcome.state,
      mastery_score: diagOutcome.masteryScore,
      confidence_score: diagOutcome.confidenceScore,
      evidence_count: diagOutcome.evidenceCount,
      mastery_source: diagOutcome.source,
      evidence_summary: diagOutcome.reason,
      last_assessed_at: new Date().toISOString(),
    });
  }

  if (rowsToUpsert.length > 0) {
    await supabase.from('learner_concept_state').upsert(rowsToUpsert, {
      onConflict: 'user_id,concept_id',
    });
  }
}

export async function recordAttemptAndUpdateState(params: {
  userId: string;
  activityId: string;
  questionId?: string;
  conceptId: string;
  submittedAnswer: string;
  isCorrect: boolean;
  score: number;
  rationale?: string;
  timeSpentSeconds: number;
  isMisconception?: boolean;
}): Promise<{ newState: LearnerConceptState | null; promotedToMastered: boolean }> {
  try {
    // 1. Record attempt in database
    await supabase.from('attempts').insert({
      user_id: params.userId,
      activity_id: params.activityId,
      question_id: params.questionId ?? null,
      concept_id: params.conceptId,
      submitted_answer: params.submittedAnswer,
      is_correct: params.isCorrect,
      score: params.score,
      rationale: params.rationale,
      time_spent_seconds: params.timeSpentSeconds,
    });

    // 2. Fetch current state
    const { data: existingState } = await supabase
      .from('learner_concept_state')
      .select('*')
      .eq('user_id', params.userId)
      .eq('concept_id', params.conceptId)
      .single();

    const currentState = existingState?.state || 'UNKNOWN';
    const currentScore = Number(existingState?.mastery_score || 0);
    const currentConfidence = Number(existingState?.confidence_score || 0);
    const currentEvidence = existingState?.evidence_count || 0;

    // 3. Evaluate deterministic state transition
    const transitionResult = evaluateStateTransition({
      currentState,
      currentMasteryScore: currentScore,
      currentConfidenceScore: currentConfidence,
      currentEvidenceCount: currentEvidence,
      isCorrect: params.isCorrect,
      attemptScore: params.score,
      isMisconception: params.isMisconception ?? false,
      source: 'practice',
    });

    // 4. Persist updated state
    const { data: updatedRow } = await supabase
      .from('learner_concept_state')
      .upsert(
        {
          user_id: params.userId,
          concept_id: params.conceptId,
          state: transitionResult.newState,
          mastery_score: transitionResult.newMasteryScore,
          confidence_score: transitionResult.newConfidenceScore,
          evidence_count: transitionResult.newEvidenceCount,
          mastery_source: transitionResult.newMasterySource,
          evidence_summary: transitionResult.transitionReason,
          last_assessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,concept_id' }
      )
      .select()
      .single();

    if (!updatedRow) {
      return { newState: null, promotedToMastered: false };
    }

    return {
      newState: {
        id: updatedRow.id,
        userId: updatedRow.user_id,
        conceptId: updatedRow.concept_id,
        state: updatedRow.state,
        masteryScore: Number(updatedRow.mastery_score),
        confidenceScore: Number(updatedRow.confidence_score),
        evidenceCount: updatedRow.evidence_count,
        masterySource: updatedRow.mastery_source,
        evidenceSummary: updatedRow.evidence_summary,
        lastAssessedAt: updatedRow.last_assessed_at,
        updatedAt: updatedRow.updated_at,
      },
      promotedToMastered: transitionResult.promotedToMastered,
    };
  } catch (err) {
    console.error('Error updating attempt and state:', err);
    return { newState: null, promotedToMastered: false };
  }
}

export async function recordMisconceptionRecord(params: {
  userId: string;
  conceptId: string;
  activityId: string;
  attemptId?: string;
  misconceptionTitle: string;
  diagnosis: string;
  confidence: number;
  remediationActivityId?: string;
}): Promise<Misconception | null> {
  try {
    const { data, error } = await supabase
      .from('misconceptions')
      .insert({
        user_id: params.userId,
        concept_id: params.conceptId,
        activity_id: params.activityId,
        attempt_id: params.attemptId ?? null,
        misconception_title: params.misconceptionTitle,
        diagnosis: params.diagnosis,
        confidence: params.confidence,
        remediation_activity_id: params.remediationActivityId ?? null,
        is_resolved: false,
      })
      .select()
      .single();

    if (error || !data) return null;

    // Trigger state change to NEEDS_REVIEW
    await supabase
      .from('learner_concept_state')
      .update({
        state: 'NEEDS_REVIEW',
        confidence_score: 0.4,
        evidence_summary: `Misconception flagged: ${params.misconceptionTitle}`,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', params.userId)
      .eq('concept_id', params.conceptId);

    return {
      id: data.id,
      userId: data.user_id,
      conceptId: data.concept_id,
      activityId: data.activity_id,
      attemptId: data.attempt_id,
      misconceptionTitle: data.misconception_title,
      diagnosis: data.diagnosis,
      confidence: Number(data.confidence),
      remediationActivityId: data.remediation_activity_id,
      isResolved: data.is_resolved,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('Error recording misconception:', err);
    return null;
  }
}

export async function resolveMisconceptionRecord(misconceptionId: string): Promise<void> {
  try {
    await supabase
      .from('misconceptions')
      .update({ is_resolved: true })
      .eq('id', misconceptionId);
  } catch (err) {
    console.error('Error resolving misconception:', err);
  }
}

export async function getUnresolvedMisconceptions(
  userId: string,
  conceptIds: string[]
): Promise<Misconception[]> {
  if (conceptIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('misconceptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_resolved', false)
      .in('concept_id', conceptIds);

    if (error || !data) return [];
    return data.map((m) => ({
      id: m.id,
      userId: m.user_id,
      conceptId: m.concept_id,
      activityId: m.activity_id,
      attemptId: m.attempt_id,
      misconceptionTitle: m.misconception_title,
      diagnosis: m.diagnosis,
      confidence: Number(m.confidence),
      remediationActivityId: m.remediation_activity_id,
      isResolved: m.is_resolved,
      createdAt: m.created_at,
    }));
  } catch {
    return [];
  }
}
