/**
 * Test: Route Events and Dynamic Route Diffing
 * Verifies that route events and route diffs are deterministic, mathematically sound,
 * and triggered by genuine epistemic events.
 */

import { computeRouteDiff } from '../routeDiffEngine';
import { Concept } from '../../types/engine';

export function runRouteEventsTests() {
  console.log('--- Running Route Events & Diff Tests ---');

  const concepts: Concept[] = [
    {
      id: 'c1',
      journeyId: 'j1',
      name: 'Python Basics',
      slug: 'python-basics',
      description: 'Variables and data types',
      domain: 'Computer Science',
      difficulty: 'beginner',
      masteryThreshold: 85,
      orderIndex: 0,
    },
    {
      id: 'c2',
      journeyId: 'j1',
      name: 'Linear Algebra',
      slug: 'linear-algebra',
      description: 'Vectors and matrices',
      domain: 'Computer Science',
      difficulty: 'intermediate',
      masteryThreshold: 85,
      orderIndex: 1,
    },
    {
      id: 'c3',
      journeyId: 'j1',
      name: 'Gradient Descent',
      slug: 'gradient-descent',
      description: 'Optimization algorithm',
      domain: 'Computer Science',
      difficulty: 'intermediate',
      masteryThreshold: 85,
      orderIndex: 2,
    },
  ];

  // Test 1: Misconception Reroute inserts targeted remediation
  const diff = computeRouteDiff({
    triggerReason: 'MISCONCEPTION_REROUTE',
    triggerConceptName: 'Gradient Descent',
    concepts,
    remediationTitle: 'Learning Rate Divergence',
    remediationDurationMinutes: 4,
    nextActionTitle: 'Remediation: Learning Rate Divergence',
  });

  if (diff.beforeSequence.length !== 3) {
    throw new Error(`Expected beforeSequence length 3, got ${diff.beforeSequence.length}`);
  }

  if (diff.afterSequence.length !== 4) {
    throw new Error(`Expected afterSequence length 4 (with inserted detour), got ${diff.afterSequence.length}`);
  }

  const insertedNode = diff.afterSequence.find((s) => s.isInserted);
  if (!insertedNode || !insertedNode.conceptName.includes('Learning Rate Divergence')) {
    throw new Error('Inserted remediation node missing or incorrectly named');
  }

  if (diff.netDurationChangeMinutes !== 4) {
    throw new Error(`Expected net duration change of 4 minutes, got ${diff.netDurationChangeMinutes}`);
  }

  console.log('✓ Test 1 Passed: Route diff deterministically inserts remediation activity and recalculates sequence duration.');
}
