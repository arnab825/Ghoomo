/**
 * Ghoomo Deterministic Mastery Policy
 * Mathematically explicit rules governing epistemic learner state transitions.
 * LLMs NEVER directly alter mastery records.
 */

import { KnowledgeState, LearnerConceptState, MasterySource } from '../types/engine';

export interface MasteryEvaluationInput {
  currentState: KnowledgeState;
  currentMasteryScore: number;
  currentConfidenceScore: number;
  currentEvidenceCount: number;
  isCorrect: boolean;
  attemptScore: number; // 0 - 100
  isMisconception: boolean;
  verifiedApplication?: boolean;
  source: MasterySource;
  rationale?: string;
}

export interface MasteryEvaluationResult {
  newState: KnowledgeState;
  newMasteryScore: number;
  newConfidenceScore: number;
  newEvidenceCount: number;
  newMasterySource: MasterySource;
  stateChanged: boolean;
  promotedToMastered: boolean;
  transitionReason: string;
}

/**
 * Checks whether the explicit mathematical conditions for MASTERED are satisfied.
 */
export function isMasterySatisfied(params: {
  evidenceCount: number;
  masteryScore: number;
  confidenceScore: number;
  verifiedApplication?: boolean;
}): boolean {
  // 1. Double-evidence verified mastery
  const standardEvidenceRule =
    params.evidenceCount >= 2 &&
    params.masteryScore >= 85 &&
    params.confidenceScore >= 0.85;

  // 2. High-confidence applied project verification
  const applicationRule =
    params.verifiedApplication === true &&
    params.masteryScore >= 85 &&
    params.confidenceScore >= 0.85;

  return standardEvidenceRule || applicationRule;
}

/**
 * Evaluates state transition upon diagnostic completion.
 * Rule: A single correct diagnostic MCQ NEVER yields MASTERED.
 * It yields PROVISIONALLY_READY to skip redundant introductory drills.
 */
export function evaluateDiagnosticOutcome(isCorrect: boolean): {
  state: KnowledgeState;
  masteryScore: number;
  confidenceScore: number;
  evidenceCount: number;
  source: MasterySource;
  reason: string;
} {
  if (isCorrect) {
    return {
      state: 'PROVISIONALLY_READY',
      masteryScore: 70,
      confidenceScore: 0.6,
      evidenceCount: 1,
      source: 'diagnostic',
      reason: 'Answered diagnostic checkpoint correctly. Provisionally ready; skipping baseline drills.',
    };
  }

  return {
    state: 'UNKNOWN',
    masteryScore: 20,
    confidenceScore: 0.3,
    evidenceCount: 1,
    source: 'diagnostic',
    reason: 'Diagnostic checkpoint not yet mastered. Scheduled for foundational learning.',
  };
}

/**
 * Pure deterministic state transition evaluator for practice, attempts, and proof.
 */
export function evaluateStateTransition(input: MasteryEvaluationInput): MasteryEvaluationResult {
  let newState: KnowledgeState = input.currentState;
  let newMasteryScore = input.currentMasteryScore;
  let newConfidenceScore = input.currentConfidenceScore;
  const newEvidenceCount = input.currentEvidenceCount + 1;
  let newMasterySource: MasterySource = input.source;
  let transitionReason = '';

  // Case 1: Misconception Detected
  if (input.isMisconception) {
    newState = 'NEEDS_REVIEW';
    newMasteryScore = Math.max(25, Math.round(newMasteryScore * 0.65));
    newConfidenceScore = Math.max(0.35, Math.round((newConfidenceScore - 0.3) * 100) / 100);
    transitionReason = 'Conceptual misconception detected. Concept flagged for remediation.';
    return {
      newState,
      newMasteryScore,
      newConfidenceScore,
      newEvidenceCount,
      newMasterySource,
      stateChanged: newState !== input.currentState,
      promotedToMastered: false,
      transitionReason,
    };
  }

  // Case 2: Correct Attempt / Applied Proof
  if (input.isCorrect) {
    // Weighted moving average toward attempt score
    newMasteryScore = Math.min(100, Math.round(newMasteryScore * 0.4 + input.attemptScore * 0.6));
    newConfidenceScore = Math.min(1.0, Math.round((newConfidenceScore + 0.25) * 100) / 100);

    const meetsMastery = isMasterySatisfied({
      evidenceCount: newEvidenceCount,
      masteryScore: newMasteryScore,
      confidenceScore: newConfidenceScore,
      verifiedApplication: input.verifiedApplication,
    });

    if (meetsMastery) {
      newState = 'MASTERED';
      newMasterySource = input.verifiedApplication ? 'application' : 'practice';
      transitionReason = `Mastery achieved with ${newEvidenceCount} verified evidence submissions (Score: ${newMasteryScore}%, Confidence: ${newConfidenceScore}).`;
    } else {
      newState = 'DEVELOPING';
      transitionReason = `Progressing well (Score: ${newMasteryScore}%). Requires additional demonstration for full mastery.`;
    }
  } else {
    // Case 4: Incorrect attempt without specific misconception
    newMasteryScore = Math.max(15, Math.round(newMasteryScore * 0.75));
    newConfidenceScore = Math.max(0.3, Math.round((newConfidenceScore - 0.15) * 100) / 100);
    if (newState === 'PROVISIONALLY_READY') {
      newState = 'DEVELOPING';
      transitionReason = 'Provisional understanding challenged by incorrect attempt. Reclassified to Developing.';
    } else if (newState !== 'NEEDS_REVIEW') {
      newState = 'DEVELOPING';
      transitionReason = 'Incorrect attempt recorded. Practice continues.';
    }
  }

  return {
    newState,
    newMasteryScore,
    newConfidenceScore,
    newEvidenceCount,
    newMasterySource,
    stateChanged: newState !== input.currentState,
    promotedToMastered: newState === 'MASTERED' && input.currentState !== 'MASTERED',
    transitionReason,
  };
}
