import { evaluateDiagnosticOutcome, evaluateStateTransition, isMasterySatisfied } from '../masteryPolicy';

export function testMasteryPolicy() {
  console.log('\n--- Running Mastery Policy Tests ---');

  // Test 1: Diagnostic Correct Answer MUST NOT yield MASTERED
  const diagRes = evaluateDiagnosticOutcome(true);
  if (diagRes.state === 'MASTERED') {
    throw new Error('Test 1 Failed: Diagnostic MCQ must NEVER grant MASTERED state.');
  }
  if (diagRes.state !== 'PROVISIONALLY_READY') {
    throw new Error(`Test 1 Failed: Expected PROVISIONALLY_READY, got: ${diagRes.state}`);
  }
  console.log('✓ Test 1 Passed: Diagnostic correct answer grants PROVISIONALLY_READY (not Mastered).');

  // Test 2: Mathematical Mastery Check
  // Case A: evidenceCount = 1 -> Should NOT be mastered
  const notMasteredYet = isMasterySatisfied({
    evidenceCount: 1,
    masteryScore: 90,
    confidenceScore: 0.90,
  });
  if (notMasteredYet) {
    throw new Error('Test 2 Failed: Single evidence must NOT satisfy mastery.');
  }

  // Case B: evidenceCount = 2, score >= 85, confidence >= 0.85 -> MASTERED
  const masteredFull = isMasterySatisfied({
    evidenceCount: 2,
    masteryScore: 88,
    confidenceScore: 0.88,
  });
  if (!masteredFull) {
    throw new Error('Test 2 Failed: Valid 2-evidence criteria should satisfy mastery.');
  }
  console.log('✓ Test 2 Passed: Strict 3-condition mathematical mastery rule enforced.');

  // Test 3: Misconception Demotes to NEEDS_REVIEW
  const misconceptionRes = evaluateStateTransition({
    currentState: 'DEVELOPING',
    currentMasteryScore: 75,
    currentConfidenceScore: 0.70,
    currentEvidenceCount: 1,
    isCorrect: false,
    attemptScore: 30,
    isMisconception: true,
    source: 'practice',
  });

  if (misconceptionRes.newState !== 'NEEDS_REVIEW') {
    throw new Error(`Test 3 Failed: Misconception must trigger NEEDS_REVIEW, got: ${misconceptionRes.newState}`);
  }
  console.log('✓ Test 3 Passed: Misconception transition accurately sets state to NEEDS_REVIEW.');
}
