/**
 * Test: Misconception Evaluation & Safe AI Degradation
 * Verifies that candidate misconceptions are evaluated deterministically,
 * AI failure degrades safely without state corruption,
 * and remediation clears the roadblock.
 */

import { evaluateStateTransition } from '../masteryPolicy';

export function runMisconceptionTests() {
  console.log('--- Running Misconception & Safe AI Tests ---');

  // Test 1: Valid high-confidence misconception transitions concept to NEEDS_REVIEW
  const misconceptionResult = evaluateStateTransition({
    currentState: 'DEVELOPING',
    currentMasteryScore: 60,
    currentConfidenceScore: 0.6,
    currentEvidenceCount: 1,
    isCorrect: false,
    attemptScore: 20,
    isMisconception: true,
    source: 'practice',
    rationale: 'Applied squared error to multi-class probabilities instead of negative log likelihood',
  });

  if (misconceptionResult.newState !== 'NEEDS_REVIEW') {
    throw new Error(`Expected state NEEDS_REVIEW, got ${misconceptionResult.newState}`);
  }

  if (misconceptionResult.newMasteryScore > 40) {
    throw new Error(`Expected masteryScore to be penalized below 40, got ${misconceptionResult.newMasteryScore}`);
  }

  console.log('✓ Test 1 Passed: Candidate misconception correctly transitions state to NEEDS_REVIEW.');

  // Test 2: AI Failure Fallback - When Gemini fails (timeout / quota), state degrades safely
  // The system records the attempt normally, does not mark false mastery, and preserves state integrity
  const attemptWithAIFailure = evaluateStateTransition({
    currentState: 'DEVELOPING',
    currentMasteryScore: 60,
    currentConfidenceScore: 0.6,
    currentEvidenceCount: 1,
    isCorrect: false,
    attemptScore: 0,
    isMisconception: false,
    source: 'practice',
  });

  if (attemptWithAIFailure.newState === 'MASTERED') {
    throw new Error('AI failure falsely granted mastery!');
  }

  // State should remain DEVELOPING with adjusted score, not corrupted
  if (attemptWithAIFailure.newState !== 'DEVELOPING') {
    throw new Error(`Expected state DEVELOPING, got ${attemptWithAIFailure.newState}`);
  }

  console.log('✓ Test 2 Passed: AI failure does not corrupt learner state or grant false mastery.');

  // Test 3: Successful completion of remediation activity restores progression readiness
  const clearedRemediation = evaluateStateTransition({
    currentState: 'NEEDS_REVIEW',
    currentMasteryScore: 35,
    currentConfidenceScore: 0.4,
    currentEvidenceCount: 2,
    isCorrect: true,
    attemptScore: 90,
    isMisconception: false,
    source: 'practice',
  });

  if (clearedRemediation.newState === 'NEEDS_REVIEW') {
    throw new Error('Completed remediation failed to clear NEEDS_REVIEW status');
  }

  if (clearedRemediation.newState !== 'DEVELOPING' && clearedRemediation.newState !== 'MASTERED') {
    throw new Error(`Expected DEVELOPING or MASTERED, got ${clearedRemediation.newState}`);
  }

  console.log('✓ Test 3 Passed: Successfully completing remediation restores progression readiness.');
}
