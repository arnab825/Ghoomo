/**
 * Test: Learning Efficiency Calculator
 * Verifies that learning efficiency is strictly computed from genuine learner state,
 * avoiding arbitrary marketing claims or hardcoded percentages.
 */

import { computeLearningEfficiency } from '../efficiencyCalculator';
import { LearningActivity, LearnerConceptState } from '../../types/engine';

export function runEfficiencyTests() {
  console.log('--- Running Efficiency Calculator Tests ---');

  const mockActivities: LearningActivity[] = [
    {
      id: 'act1',
      journeyId: 'j1',
      conceptId: 'c1',
      type: 'PRACTICE',
      title: 'Variables drill',
      description: 'Variables',
      durationMinutes: 10,
      isRemediation: false,
      orderIndex: 0,
    },
    {
      id: 'act2',
      journeyId: 'j1',
      conceptId: 'c2',
      type: 'PRACTICE',
      title: 'Matrix multiplication drill',
      description: 'Matrices',
      durationMinutes: 15,
      isRemediation: false,
      orderIndex: 1,
    },
    {
      id: 'act3',
      journeyId: 'j1',
      conceptId: 'c3',
      type: 'APPLY',
      title: 'Implement gradient descent',
      description: 'Gradient descent',
      durationMinutes: 20,
      isRemediation: false,
      orderIndex: 2,
    },
  ];

  // Case 1: Learner has mastered c1 and c2 from prior diagnostic verification
  const learnerStates = new Map<string, LearnerConceptState>([
    [
      'c1',
      {
        userId: 'u1',
        conceptId: 'c1',
        state: 'PROVISIONALLY_READY',
        masteryScore: 75,
        confidenceScore: 0.7,
        evidenceCount: 1,
        masterySource: 'diagnostic',
      },
    ],
    [
      'c2',
      {
        userId: 'u1',
        conceptId: 'c2',
        state: 'MASTERED',
        masteryScore: 90,
        confidenceScore: 0.9,
        evidenceCount: 2,
        masterySource: 'practice',
      },
    ],
    [
      'c3',
      {
        userId: 'u1',
        conceptId: 'c3',
        state: 'DEVELOPING',
        masteryScore: 40,
        confidenceScore: 0.3,
        evidenceCount: 1,
        masterySource: 'practice',
      },
    ],
  ]);

  const efficiency = computeLearningEfficiency({
    baselineActivityCount: 3,
    allActivities: mockActivities,
    learnerStates,
  });

  if (efficiency.avoidedActivityCount !== 2) {
    throw new Error(`Expected avoidedActivityCount 2, got ${efficiency.avoidedActivityCount}`);
  }

  if (efficiency.estimatedMinutesAvoided !== 25) {
    throw new Error(`Expected estimatedMinutesAvoided 25 (10+15), got ${efficiency.estimatedMinutesAvoided}`);
  }

  if (efficiency.personalizedActivityCount !== 1) {
    throw new Error(`Expected personalizedActivityCount 1, got ${efficiency.personalizedActivityCount}`);
  }

  console.log('✓ Test 1 Passed: Learner with verified prior mastery accurately skips known activities and saves 25 minutes.');
}
