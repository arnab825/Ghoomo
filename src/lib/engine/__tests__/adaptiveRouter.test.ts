import { getNextBestLearningAction } from '../adaptiveRouter';
import { Concept, LearningActivity, ConceptPrerequisite, LearnerConceptState, Misconception } from '../../types/engine';

export function testAdaptiveRouter() {
  console.log('\n--- Running Adaptive Router Tests ---');

  const concepts: Concept[] = [
    { id: 'c-python', journeyId: 'j1', name: 'Python Basics', slug: 'python', description: '', domain: 'CS', difficulty: 'beginner', masteryThreshold: 80, orderIndex: 0 },
    { id: 'c-numpy', journeyId: 'j1', name: 'NumPy Arrays', slug: 'numpy', description: '', domain: 'CS', difficulty: 'intermediate', masteryThreshold: 80, orderIndex: 1 },
    { id: 'c-scaling', journeyId: 'j1', name: 'Feature Scaling', slug: 'scaling', description: '', domain: 'ML', difficulty: 'intermediate', masteryThreshold: 80, orderIndex: 2 },
  ];

  const prerequisites: ConceptPrerequisite[] = [
    { conceptId: 'c-numpy', prerequisiteConceptId: 'c-python' },
    { conceptId: 'c-scaling', prerequisiteConceptId: 'c-numpy' },
  ];

  const activities: LearningActivity[] = [
    { id: 'act-python', journeyId: 'j1', conceptId: 'c-python', type: 'EXPLAIN', title: 'Learn Python Basics', description: '', durationMinutes: 10, isRemediation: false, orderIndex: 0 },
    { id: 'act-numpy', journeyId: 'j1', conceptId: 'c-numpy', type: 'PRACTICE', title: 'Practice NumPy Arrays', description: '', durationMinutes: 12, isRemediation: false, orderIndex: 1 },
    { id: 'act-scaling', journeyId: 'j1', conceptId: 'c-scaling', type: 'PRACTICE', title: 'Apply Feature Scaling', description: '', durationMinutes: 8, isRemediation: false, orderIndex: 2 },
    { id: 'act-remed-scaling', journeyId: 'j1', conceptId: 'c-scaling', type: 'REMEDIATE', title: 'Remediation: Z-Scores vs Min-Max', description: '', durationMinutes: 4, isRemediation: true, orderIndex: 3 },
  ];

  // Test 1: Learner A (Python and NumPy Mastered) -> Next Best Action is Feature Scaling
  const learnerStatesA = new Map<string, LearnerConceptState>();
  learnerStatesA.set('c-python', { userId: 'uA', conceptId: 'c-python', state: 'MASTERED', masteryScore: 90, confidenceScore: 0.9, evidenceCount: 2, masterySource: 'practice' });
  learnerStatesA.set('c-numpy', { userId: 'uA', conceptId: 'c-numpy', state: 'MASTERED', masteryScore: 88, confidenceScore: 0.88, evidenceCount: 2, masterySource: 'practice' });
  learnerStatesA.set('c-scaling', { userId: 'uA', conceptId: 'c-scaling', state: 'UNKNOWN', masteryScore: 0, confidenceScore: 0, evidenceCount: 0, masterySource: 'diagnostic' });

  const nbaA = getNextBestLearningAction({
    concepts,
    activities,
    prerequisites,
    learnerStates: learnerStatesA,
    misconceptions: [],
  });

  if (!nbaA || nbaA.conceptId !== 'c-scaling') {
    throw new Error(`Test 1 Failed: Expected Learner A to get Feature Scaling, got: ${nbaA?.conceptName}`);
  }
  console.log(`✓ Test 1 Passed: Learner A with mastered prerequisites routed directly to: ${nbaA.conceptName}`);

  // Test 2: Learner B (Python Missing, NumPy Unknown) -> Next Best Action is Python
  const learnerStatesB = new Map<string, LearnerConceptState>();
  learnerStatesB.set('c-python', { userId: 'uB', conceptId: 'c-python', state: 'UNKNOWN', masteryScore: 0, confidenceScore: 0, evidenceCount: 0, masterySource: 'diagnostic' });
  learnerStatesB.set('c-numpy', { userId: 'uB', conceptId: 'c-numpy', state: 'UNKNOWN', masteryScore: 0, confidenceScore: 0, evidenceCount: 0, masterySource: 'diagnostic' });
  learnerStatesB.set('c-scaling', { userId: 'uB', conceptId: 'c-scaling', state: 'UNKNOWN', masteryScore: 0, confidenceScore: 0, evidenceCount: 0, masterySource: 'diagnostic' });

  const nbaB = getNextBestLearningAction({
    concepts,
    activities,
    prerequisites,
    learnerStates: learnerStatesB,
    misconceptions: [],
  });

  if (!nbaB || nbaB.conceptId !== 'c-python') {
    throw new Error(`Test 2 Failed: Expected Learner B to get Python Basics, got: ${nbaB?.conceptName}`);
  }
  console.log(`✓ Test 2 Passed: Learner B with missing prerequisite routed to foundational: ${nbaB.conceptName}`);

  // TECHNICAL PROOF: Identical Goal, Two Different Routes
  if ((nbaA.conceptId as string) === (nbaB.conceptId as string)) {
    throw new Error('Test Failed: Learner A and Learner B should have received different Next Best Actions!');
  }
  console.log('✓ MATHEMATICAL PROOF PASSED: Same Goal ("Build an ML Classifier") produces different Next Best Actions based on epistemic state.');

  // Test 3: Misconception Remediation Priority
  const misconceptions: Misconception[] = [
    {
      id: 'm1',
      userId: 'uA',
      conceptId: 'c-scaling',
      activityId: 'act-scaling',
      misconceptionTitle: 'Confusing Standardization with Min-Max',
      diagnosis: 'Learner thought standardization bounds to [0,1]',
      confidence: 0.92,
      remediationActivityId: 'act-remed-scaling',
      isResolved: false,
    },
  ];

  const nbaRemediation = getNextBestLearningAction({
    concepts,
    activities,
    prerequisites,
    learnerStates: learnerStatesA,
    misconceptions,
  });

  if (!nbaRemediation || nbaRemediation.activityId !== 'act-remed-scaling') {
    throw new Error('Test 3 Failed: Misconception must trigger immediate remediation task.');
  }
  console.log(`✓ Test 3 Passed: Misconception correctly supersedes regular progression: ${nbaRemediation.activityTitle}`);
}
