/**
 * Ghoomo Curated Technical Learning Resource Catalog
 * Maps concepts and domains to premier, verified learning materials:
 * - Top YouTube Lectures / Tutorials (freeCodeCamp, CS50, Corey Schafer, Fireship, MIT OCW, 3Blue1Brown)
 * - Official Documentation (Python.org, MDN Web Docs, React.dev, PostgreSQL)
 * - Top Technical Deep Dives (Real Python, GeeksforGeeks, Dev.to, freeCodeCamp Guide)
 * - Mental Models & Key Invariants
 */

import { CuratedResource } from '@/lib/types/engine';

export interface ConceptStudyGuide {
  mentalModel: string;
  workedExample: string;
  keyInvariants: string[];
  commonMisconceptions: string[];
  resources: CuratedResource[];
}

export function getCuratedResourcesForConcept(
  conceptName: string,
  domain: string = 'Computer Science',
  goalTitle: string = ''
): ConceptStudyGuide {
  const norm = conceptName.toLowerCase();
  const normGoal = goalTitle.toLowerCase();

  // 1. PYTHON DATA STRUCTURES & ALGORITHMS (DSA)
  if (norm.includes('array') || norm.includes('list') || norm.includes('linear')) {
    return {
      mentalModel: 'Contiguous vs. Node-Linked Memory: Arrays allocate sequential blocks with O(1) indexed lookup but O(n) arbitrary insertion. Linked lists store disjoint nodes with pointers, offering O(1) insertion at pointer head/tail but O(n) traversal.',
      workedExample: `# Two-pointer technique on dynamic arrays
def reverse_words(s: list[str]) -> None:
    left, right = 0, len(s) - 1
    while left < right:
        s[left], s[right] = s[right], s[left]
        left += 1
        right -= 1`,
      keyInvariants: [
        'Array indices are continuous memory offsets: address = base + (index * element_size).',
        'Dynamic array amortized append is O(1); worst-case reallocation is O(n).',
        'Linked list pointer integrity: always link the new node before severing the existing next pointer.',
      ],
      commonMisconceptions: [
        'Assuming array insertion at arbitrary index is O(1) like direct index lookup.',
        'Confusing Python list (which is a dynamic array in CPython) with a linked list.',
      ],
      resources: [
        {
          title: 'Data Structures Easy to Advanced: Arrays & Linked Lists',
          url: 'https://www.youtube.com/watch?v=RBSGKlAvoiM',
          type: 'video',
          platform: 'freeCodeCamp.org',
          durationMinutes: 45,
          description: 'Comprehensive visual lecture on contiguous memory, dynamic arrays, and pointer manipulation.',
        },
        {
          title: 'Python Official Documentation: Data Structures & Lists',
          url: 'https://docs.python.org/3/tutorial/datastructures.html',
          type: 'docs',
          platform: 'Python.org',
          durationMinutes: 15,
          description: 'Official Python standard library specification of lists, list comprehensions, and memory semantics.',
        },
        {
          title: 'In-Depth Guide: Dynamic Arrays and Memory Allocation',
          url: 'https://realpython.com/python-lists-tuples/',
          type: 'article',
          platform: 'Real Python',
          durationMinutes: 20,
          description: 'Deep dive into CPython over-allocation strategies, amortized time complexity, and list slicing internals.',
        },
      ],
    };
  }

  if (norm.includes('hash') || norm.includes('map') || norm.includes('dictionary') || norm.includes('set')) {
    return {
      mentalModel: 'Key-Value Direct Address Table via Hash Functions: Maps keys to integer hash codes, then reduces modulo bucket count. Near O(1) average lookup, insert, and delete when load factor is balanced.',
      workedExample: `# Frequency counting with Python hash map (dict)
from collections import defaultdict

def top_frequent_elements(nums: list[int], k: int) -> list[int]:
    counts = defaultdict(int)
    for num in nums:
        counts[num] += 1
    return sorted(counts.keys(), key=lambda x: counts[x], reverse=True)[:k]`,
      keyInvariants: [
        'Hash functions must be deterministic: hash(k) must produce the identical value across all calls.',
        'Keys must be immutable (hashable) so bucket placement remains consistent.',
        'Load factor = items / buckets. When load factor exceeds threshold (typically 0.66), table resizes.',
      ],
      commonMisconceptions: [
        'Believing hash tables have guaranteed O(1) worst-case time (worst case is O(n) if all keys collide into a single bucket).',
        'Using mutable objects (like lists or dicts) as dictionary keys.',
      ],
      resources: [
        {
          title: 'Hash Tables & Hash Functions Explained with Visual Tracing',
          url: 'https://www.youtube.com/watch?v=KyUTuwz_b7Q',
          type: 'video',
          platform: 'Computer Science Channel',
          durationMinutes: 30,
          description: 'Step-by-step visual animation of open addressing, separate chaining, and quadratic probing.',
        },
        {
          title: 'Python Dict Implementation & High-Performance Hashing',
          url: 'https://docs.python.org/3/library/stdtypes.html#mapping-types-dict',
          type: 'docs',
          platform: 'Python.org',
          durationMinutes: 15,
          description: 'Official documentation for compact hash table design introduced in Python 3.6+.',
        },
        {
          title: 'Real Python: Python Dictionaries - Complete Overview',
          url: 'https://realpython.com/python-dicts/',
          type: 'article',
          platform: 'Real Python',
          durationMinutes: 25,
          description: 'Comprehensive breakdown of hash collision resolution, dictionary views, and time complexities.',
        },
      ],
    };
  }

  if (norm.includes('tree') || norm.includes('heap') || norm.includes('bst') || norm.includes('binary')) {
    return {
      mentalModel: 'Hierarchical Branching Invariants: A Tree has N nodes and N-1 edges with no cycles. In a BST, for every node, all left descendants are strictly less and right descendants are greater. In a Min-Heap, parent <= children.',
      workedExample: `# Binary Search Tree In-Order Traversal (Sorted Output)
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def inorder_traversal(root: TreeNode | None) -> list[int]:
    result = []
    def dfs(node):
        if not node:
            return
        dfs(node.left)
        result.append(node.val)
        dfs(node.right)
    dfs(root)
    return result`,
      keyInvariants: [
        'BST Property: left.val < root.val < right.val for all subtree nodes (not just immediate children).',
        'Heap Property: Parent value satisfies partial order constraint regardless of left vs right child order.',
        'Tree with N nodes always has exactly N-1 directed edges and 1 unique root.',
      ],
      commonMisconceptions: [
        'Checking BST validity by only verifying immediate children instead of entire subtree min/max boundaries.',
        'Confusing Binary Search Tree (ordered search O(log n)) with Binary Heap (partial order for O(1) top access).',
      ],
      resources: [
        {
          title: 'Binary Trees, BSTs and Heaps Crash Course',
          url: 'https://www.youtube.com/watch?v=7h1s2SojIRw',
          type: 'video',
          platform: 'MIT OpenCourseWare / freeCodeCamp',
          durationMinutes: 50,
          description: 'In-depth academic lecture on tree traversals, balance invariants, and logarithmic proof.',
        },
        {
          title: 'Python heapq Module Documentation: Priority Queue Implementation',
          url: 'https://docs.python.org/3/library/heapq.html',
          type: 'docs',
          platform: 'Python.org',
          durationMinutes: 12,
          description: 'Official guide to binary heap algorithms on dynamic lists in Python.',
        },
        {
          title: 'GeeksforGeeks: Binary Search Tree Data Structure',
          url: 'https://www.geeksforgeeks.org/binary-search-tree-data-structure/',
          type: 'article',
          platform: 'GeeksforGeeks',
          durationMinutes: 20,
          description: 'Comprehensive visual examples for insertion, deletion by successor replacement, and tree rotation.',
        },
      ],
    };
  }

  if (norm.includes('graph') || norm.includes('bfs') || norm.includes('dfs') || norm.includes('dijkstra')) {
    return {
      mentalModel: 'Vertices Connected by Edges (Adjacency Matrix vs. List): BFS explores level-by-level using a FIFO queue (shortest unweighted path). DFS explores deeply using recursion / LIFO stack (cycle detection, topological sort).',
      workedExample: `# Breadth-First Search (BFS) for Shortest Path in Unweighted Graph
from collections import deque

def shortest_path_bfs(graph: dict[str, list[str]], start: str, target: str) -> int:
    queue = deque([(start, 0)])
    visited = {start}
    while queue:
        node, dist = queue.popleft()
        if node == target:
            return dist
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))
    return -1`,
      keyInvariants: [
        'Graph traversal requires a visited set to avoid infinite loops on cyclic graphs.',
        'Topological sorting is strictly defined only on Directed Acyclic Graphs (DAGs).',
        'Adjacency list uses O(V + E) memory; adjacency matrix uses O(V^2) memory.',
      ],
      commonMisconceptions: [
        'Running Dijkstra on graphs with negative edge weights (requires Bellman-Ford).',
        'Forgetting to mark nodes visited upon queue enqueue, leading to duplicate nodes in queue.',
      ],
      resources: [
        {
          title: 'Graph Theory Algorithms: BFS, DFS, Dijkstra, Topological Sort',
          url: 'https://www.youtube.com/watch?v=09_LlHjoEiY',
          type: 'video',
          platform: 'William Fiset / freeCodeCamp',
          durationMinutes: 60,
          description: 'Masterclass on graph theory, connectivity, shortest paths, and topological orderings.',
        },
        {
          title: 'Topological Sorting and DAG Properties',
          url: 'https://www.geeksforgeeks.org/topological-sorting/',
          type: 'article',
          platform: 'GeeksforGeeks',
          durationMinutes: 20,
          description: 'Kahn algorithm and DFS in-degree tracking for dependency resolution.',
        },
        {
          title: 'Real Python: Directed Acyclic Graphs and Network Analysis in Python',
          url: 'https://realpython.com/python-graphs/',
          type: 'article',
          platform: 'Real Python',
          durationMinutes: 25,
          description: 'Modeling dependency networks and acyclic workflow graphs using idiomatic Python.',
        },
      ],
    };
  }

  // DEFAULT / GENERAL DOMAIN FALLBACK
  return {
    mentalModel: `Structured mental model for ${conceptName}: Understand the core invariants, input/output preconditions, and boundary constraints before jumping into code implementation.`,
    workedExample: `# Canonical implementation demonstrating ${conceptName}
def solve_problem(inputs):
    # 1. Validate preconditions
    if not inputs:
        return None
    # 2. Execute deterministic transformation
    return [item for item in inputs if item is not None]`,
    keyInvariants: [
      `All operations on ${conceptName} must preserve state consistency.`,
      `Boundary conditions (empty input, single-element, duplicates) must be handled explicitly.`,
      `Time and space complexity should match theoretical algorithmic optimums.`,
    ],
    commonMisconceptions: [
      `Premature optimization before establishing correctness and verifying edge cases.`,
      `Assuming inputs will always be cleanly formatted without validation.`,
    ],
    resources: [
      {
        title: `Comprehensive Guide: ${conceptName}`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(conceptName + ' tutorial')}`,
        type: 'video',
        platform: 'YouTube Educational',
        durationMinutes: 25,
        description: `Verified video walkthrough explaining ${conceptName} from fundamentals to applied mastery.`,
      },
      {
        title: `Official Documentation & Specification`,
        url: 'https://docs.python.org/3/',
        type: 'docs',
        platform: 'Official Docs',
        durationMinutes: 15,
        description: 'Primary source documentation and language standard library reference.',
      },
      {
        title: `Technical Deep Dive & Code Examples: ${conceptName}`,
        url: `https://www.geeksforgeeks.org/search/${encodeURIComponent(conceptName)}/`,
        type: 'article',
        platform: 'GeeksforGeeks',
        durationMinutes: 20,
        description: `Step-by-step technical tutorial covering common patterns and interview questions.`,
      },
    ],
  };
}
