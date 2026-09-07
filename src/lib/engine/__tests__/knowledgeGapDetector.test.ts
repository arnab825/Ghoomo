import { detectKnowledgeGaps } from '../knowledgeGapDetector';
import { Concept, ConceptPrerequisite, LearnerConceptState, Misconception } from '../../types/engine';

export function testKnowledgeGapDetector() {
  console.log('\n--- Running Knowledge Gap Detector Tests ---');

  const concepts: Concept[] = [
    { id: 'c-python', journeyId: 'j1', name: 'Python Basics', slug: 'python', description: '', domain: 'CS', difficulty: 'beginner', masteryThreshold: 80, orderIndex: 0 },
    { id: 'c-numpy', journeyId: 'j1', name: 'NumPy Arrays', slug: 'numpy', description: '', domain: 'CS', difficulty: 'intermediate', masteryThreshold: 80, orderIndex: 1 },
    { id: 'c-scaling', journeyId: 'j1', name: 'Feature Scaling', slug: 'scaling', description: '', domain: 'ML', difficulty: 'intermediate', masteryThreshold: 80, orderIndex: 2 },
  ];

  // numpy requires python, scaling requires numpy
  const prerequisites: ConceptPrerequisite[] = [
    { conceptId: 'c-numpy', prerequisiteConceptId: 'c-python' },
    { conceptId: 'c-scaling', prerequisiteConceptId: 'c-numpy' },
  ];

  // Scenario 1: Python is Mastered, NumPy is Unknown -> Scaling is Blocked, NumPy is Missing Prerequisite
  const learnerStates = new Map<string, LearnerConceptState>();
  learnerStates.set('c-python', {
    userId: 'u1',
    conceptId: 'c-python',
    state: 'MASTERED',
    masteryScore: 90,
    confidenceScore: 0.9,
    evidenceCount: 2,
    masterySource: 'practice',
  });
  learnerStates.set('c-numpy', {
    userId: 'u1',
    conceptId: 'c-numpy',
    state: 'UNKNOWN',
    masteryScore: 0,
    confidenceScore: 0,
    evidenceCount: 0,
    masterySource: 'diagnostic',
  });
  learnerStates.set('c-scaling', {
    userId: 'u1',
    conceptId: 'c-scaling',
    state: 'UNKNOWN',
    masteryScore: 0,
    confidenceScore: 0,
    evidenceCount: 0,
    masterySource: 'diagnostic',
  });

  const gaps = detectKnowledgeGaps({
    concepts,
    prerequisites,
    learnerStates,
    misconceptions: [],
  });

  if (!gaps.blockedConcepts.includes('c-scaling')) {
    throw new Error('Test 1 Failed: Scaling should be blocked because NumPy is not mastered.');
  }
  if (!gaps.missingPrerequisites.includes('c-numpy')) {
    throw new Error('Test 1 Failed: NumPy should be identified as a missing prerequisite.');
  }
  if (!gaps.safelySkippableConcepts.includes('c-python')) {
    throw new Error('Test 1 Failed: Python should be categorized as safely skippable.');
  }
  if (!gaps.readyEligibleConcepts.includes('c-numpy')) {
    throw new Error('Test 1 Failed: NumPy should be ready and eligible since its prereq (Python) is satisfied.');
  }

  console.log('✓ Test 1 Passed: Gap detector correctly identified blocked nodes, missing prerequisites, and eligible next actions.');
}
