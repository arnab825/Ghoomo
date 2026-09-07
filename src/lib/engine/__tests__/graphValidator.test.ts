import { validateAndRepairConceptDAG, RawCandidateNode } from '../graphValidator';

export function testGraphValidator() {
  console.log('\n--- Running Graph Validator Tests ---');

  // Test 1: Clean Acyclic Graph
  const cleanGraph: RawCandidateNode[] = [
    { name: 'Python Basics', slug: 'python', description: 'Core syntax', domain: 'CS', difficulty: 'beginner', masteryThreshold: 80, orderIndex: 0, prerequisiteSlugs: [] },
    { name: 'NumPy Arrays', slug: 'numpy', description: 'Vector math', domain: 'CS', difficulty: 'intermediate', masteryThreshold: 80, orderIndex: 1, prerequisiteSlugs: ['python'] },
    { name: 'Feature Scaling', slug: 'scaling', description: 'Normalization', domain: 'ML', difficulty: 'intermediate', masteryThreshold: 80, orderIndex: 2, prerequisiteSlugs: ['numpy'] },
  ];

  const resClean = validateAndRepairConceptDAG(cleanGraph);
  if (!resClean.isValid || resClean.repairedEdgesCount !== 0) {
    throw new Error('Test 1 Failed: Clean graph should be valid without repairs.');
  }
  if (resClean.topologicalOrder.join(',') !== 'python,numpy,scaling') {
    throw new Error(`Test 1 Failed: Expected topological order python,numpy,scaling, got: ${resClean.topologicalOrder.join(',')}`);
  }
  console.log('✓ Test 1 Passed: Clean acyclic graph validated and topologically sorted.');

  // Test 2: Circular Dependency Detection & Deterministic Repair
  // A -> B -> C -> A
  const circularGraph: RawCandidateNode[] = [
    { name: 'Concept A', slug: 'concept-a', description: 'A', domain: 'CS', difficulty: 'beginner', masteryThreshold: 80, orderIndex: 0, prerequisiteSlugs: ['concept-c'], confidence: 0.70 },
    { name: 'Concept B', slug: 'concept-b', description: 'B', domain: 'CS', difficulty: 'intermediate', masteryThreshold: 80, orderIndex: 1, prerequisiteSlugs: ['concept-a'], confidence: 0.95 },
    { name: 'Concept C', slug: 'concept-c', description: 'C', domain: 'CS', difficulty: 'advanced', masteryThreshold: 80, orderIndex: 2, prerequisiteSlugs: ['concept-b'], confidence: 0.90 },
  ];

  const resCycle = validateAndRepairConceptDAG(circularGraph);
  if (!resCycle.isValid) {
    throw new Error('Test 2 Failed: Cycle should have been deterministically repaired.');
  }
  if (resCycle.repairedEdgesCount === 0) {
    throw new Error('Test 2 Failed: Expected repaired edges count > 0.');
  }
  console.log(`✓ Test 2 Passed: Cycle detected and deterministically repaired (${resCycle.repairedEdgesCount} edges pruned). Resulting DAG is valid.`);

  // Test 3: Self-Reference Elimination (A -> A)
  const selfRefGraph: RawCandidateNode[] = [
    { name: 'Concept X', slug: 'concept-x', description: 'Self ref', domain: 'CS', difficulty: 'beginner', masteryThreshold: 80, orderIndex: 0, prerequisiteSlugs: ['concept-x'] },
  ];
  const resSelf = validateAndRepairConceptDAG(selfRefGraph);
  if (!resSelf.isValid || resSelf.repairedEdgesCount !== 1) {
    throw new Error('Test 3 Failed: Self-reference should be pruned.');
  }
  console.log('✓ Test 3 Passed: Self-reference (X -> X) successfully rejected and pruned.');
}
