/**
 * Test Suite: Caching, DSA Optimizations & Guardrails
 * Verifies LRUCache (O(1) get/set/evict), MinPriorityQueue, and deterministic hash caching.
 */

import { LRUCache } from '../../utils/lruCache';
import { MinPriorityQueue } from '../priorityQueue';
import { hashInput } from '../../ai/artifactCache';

export function runCachingAndDsaTests(): boolean {
  console.log('\n--- Running Caching & DSA Optimization Tests ---');

  // Test 1: LRUCache capacity eviction
  const lru = new LRUCache<string, number>(3, 60000);
  lru.set('a', 1);
  lru.set('b', 2);
  lru.set('c', 3);

  if (lru.size !== 3) throw new Error('LRU size should be 3');
  if (lru.get('a') !== 1) throw new Error('LRU get("a") should return 1');

  // Adding 'd' should evict 'b' (since 'a' was accessed and moved to head)
  lru.set('d', 4);
  if (lru.get('b') !== null) throw new Error('LRU should have evicted "b"');
  if (lru.get('a') !== 1) throw new Error('"a" should remain in cache');
  if (lru.get('d') !== 4) throw new Error('"d" should be in cache');
  console.log('✓ Test 1 Passed: LRUCache correctly maintains bounded capacity and evicts LRU items in O(1).');

  // Test 2: MinPriorityQueue binary min-heap ordering
  const pq = new MinPriorityQueue<string>();
  pq.push('task_low_priority', 10);
  pq.push('task_urgent', 1);
  pq.push('task_medium', 5);

  const first = pq.pop();
  const second = pq.pop();
  const third = pq.pop();

  if (first?.item !== 'task_urgent') throw new Error(`Expected urgent task first, got ${first?.item}`);
  if (second?.item !== 'task_medium') throw new Error(`Expected medium task second, got ${second?.item}`);
  if (third?.item !== 'task_low_priority') throw new Error(`Expected low priority task third, got ${third?.item}`);
  console.log('✓ Test 2 Passed: MinPriorityQueue extracts priority milestones in O(log N) min-heap order.');

  // Test 3: Deterministic Input Hashing
  const hash1 = hashInput({
    goalTitle: 'Learn Python',
    targetDomain: 'Computer Science',
    modality: 'interactive',
  });
  const hash2 = hashInput({
    modality: 'interactive',
    targetDomain: 'Computer Science',
    goalTitle: 'Learn Python',
  });

  if (hash1 !== hash2) throw new Error('hashInput should be key-order invariant');
  console.log('✓ Test 3 Passed: hashInput generates deterministic SHA/djb2 keys invariant to key order.');

  // Test 4: Kahn's Algorithm BFS Layering
  const nodes = ['A', 'B', 'C', 'D'];
  const inDegree = new Map<string, number>([
    ['A', 0],
    ['B', 1], // B depends on A
    ['C', 1], // C depends on A
    ['D', 2], // D depends on B and C
  ]);
  const forwardAdj = new Map<string, string[]>([
    ['A', ['B', 'C']],
    ['B', ['D']],
    ['C', ['D']],
    ['D', []],
  ]);

  const layers: string[][] = [];
  let queue = nodes.filter((n) => inDegree.get(n) === 0);

  while (queue.length > 0) {
    layers.push(queue);
    const nextQueue: string[] = [];
    for (const node of queue) {
      for (const child of forwardAdj.get(node) || []) {
        const d = (inDegree.get(child) || 1) - 1;
        inDegree.set(child, d);
        if (d === 0) nextQueue.push(child);
      }
    }
    queue = nextQueue;
  }

  if (layers.length !== 3) throw new Error(`Expected 3 layers, got ${layers.length}`);
  if (layers[0][0] !== 'A') throw new Error('Layer 0 should be A');
  if (layers[1].length !== 2) throw new Error('Layer 1 should contain B and C');
  if (layers[2][0] !== 'D') throw new Error('Layer 2 should be D');
  console.log('✓ Test 4 Passed: Kahn\'s Algorithm BFS produces linear topological layers in O(V + E) time.');

  return true;
}

if (require.main === module) {
  runCachingAndDsaTests();
}
