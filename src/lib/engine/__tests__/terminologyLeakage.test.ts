import {
  LEARNER_TERMINOLOGY,
  ADMIN_TERMINOLOGY,
  formatLearnerState,
  formatDifficultyLevel,
  formatLockReason,
} from '../../utils/terminology';

function runTerminologyTests() {
  console.log('\n--- Running Terminology Dictionary & Leakage Tests ---');

  // 1. Verify key learner terms are plain English
  if (LEARNER_TERMINOLOGY.knowledge_graph !== 'Learning Map') {
    throw new Error(`Expected 'Learning Map' but got ${LEARNER_TERMINOLOGY.knowledge_graph}`);
  }
  if (LEARNER_TERMINOLOGY.concept !== 'Topic') {
    throw new Error(`Expected 'Topic' but got ${LEARNER_TERMINOLOGY.concept}`);
  }
  if (LEARNER_TERMINOLOGY.prerequisite !== 'Learn this first') {
    throw new Error(`Expected 'Learn this first' but got ${LEARNER_TERMINOLOGY.prerequisite}`);
  }
  if (LEARNER_TERMINOLOGY.misconception_detected !== "Let's clear up this idea") {
    throw new Error(`Expected "Let's clear up this idea" but got ${LEARNER_TERMINOLOGY.misconception_detected}`);
  }
  if (LEARNER_TERMINOLOGY.evidence_submission !== 'Show Your Work') {
    throw new Error(`Expected 'Show Your Work' but got ${LEARNER_TERMINOLOGY.evidence_submission}`);
  }
  if (LEARNER_TERMINOLOGY.adaptive_router !== 'Your next best step') {
    throw new Error(`Expected 'Your next best step' but got ${LEARNER_TERMINOLOGY.adaptive_router}`);
  }

  // 2. State formatters
  if (formatLearnerState('PROVISIONALLY_READY') !== 'Ready to move on') {
    throw new Error(`Expected 'Ready to move on' for PROVISIONALLY_READY`);
  }
  if (formatLearnerState('NEEDS_REVIEW') !== 'Idea to review') {
    throw new Error(`Expected 'Idea to review' for NEEDS_REVIEW`);
  }
  if (formatLearnerState('MASTERED') !== 'Mastered') {
    throw new Error(`Expected 'Mastered' for MASTERED`);
  }

  // 3. Difficulty ladder formatters
  const l1 = formatDifficultyLevel(1);
  if (l1.name !== 'Understand') throw new Error(`Expected 'Understand' for level 1`);
  const l3 = formatDifficultyLevel(3);
  if (l3.name !== 'Reason') throw new Error(`Expected 'Reason' for level 3`);
  const l4 = formatDifficultyLevel(4);
  if (l4.name !== 'Solve') throw new Error(`Expected 'Solve' for level 4`);

  // 4. Lock explanation
  const lockMsg = formatLockReason('Binary Search');
  if (!lockMsg.includes('Learn Binary Search first')) {
    throw new Error(`Lock explanation should mention prerequisite topic warmly`);
  }

  console.log('✓ All Terminology & UI Translation tests passed successfully.');
}

runTerminologyTests();
