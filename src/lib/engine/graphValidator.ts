/**
 * Ghoomo Prerequisite Graph Validator
 * Enforces the strict DAG invariant on candidate AI-generated concept graphs.
 * Under no circumstances does an unverified or cyclical graph enter concept_prerequisites.
 */

export interface RawCandidateNode {
  name: string;
  slug: string;
  description: string;
  domain: string;
  moduleName?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  masteryThreshold: number;
  orderIndex: number;
  prerequisiteSlugs: string[];
  confidence?: number;
}

export interface ValidatedPrerequisiteEdge {
  fromSlug: string; // The prerequisite concept
  toSlug: string;   // The dependent concept
  confidence: number;
}

export interface ValidatedDAGResult {
  isValid: boolean;
  nodes: RawCandidateNode[];
  edges: ValidatedPrerequisiteEdge[];
  topologicalOrder: string[]; // Slugs in valid prerequisite-to-dependent order
  repairedEdgesCount: number;
  diagnostics: string[];
  reverseDependencyMap?: Map<string, Set<string>>;
  dependencyDepthMap?: Map<string, number>;
  rootSlugs?: string[];
  leafSlugs?: string[];
}

enum Color {
  WHITE = 0, // Unvisited
  GRAY = 1,  // Visiting in current DFS recursion stack (Cycle trigger!)
  BLACK = 2, // Fully processed
}

/**
 * Validates, repairs, and topologically sorts a candidate concept graph.
 */
export function validateAndRepairConceptDAG(candidateNodes: RawCandidateNode[]): ValidatedDAGResult {
  const diagnostics: string[] = [];
  let repairedEdgesCount = 0;

  // 1. Index nodes and validate uniqueness
  const nodeMap = new Map<string, RawCandidateNode>();
  for (const node of candidateNodes) {
    if (nodeMap.has(node.slug)) {
      diagnostics.push(`Duplicate concept slug detected: "${node.slug}". Keeping first occurrence.`);
    } else {
      nodeMap.set(node.slug, node);
    }
  }

  const cleanNodes = Array.from(nodeMap.values());
  const validSlugs = new Set(cleanNodes.map((n) => n.slug));

  // 2. Build candidate edge list & filter self-references / non-existent targets
  const candidateEdges: ValidatedPrerequisiteEdge[] = [];
  for (const node of cleanNodes) {
    const dependentSlug = node.slug;
    for (const prereqSlug of node.prerequisiteSlugs) {
      if (prereqSlug === dependentSlug) {
        diagnostics.push(`Pruned self-referencing edge on concept: "${dependentSlug}".`);
        repairedEdgesCount++;
        continue;
      }
      if (!validSlugs.has(prereqSlug)) {
        diagnostics.push(`Pruned non-existent prerequisite target: "${prereqSlug}" for "${dependentSlug}".`);
        repairedEdgesCount++;
        continue;
      }
      candidateEdges.push({
        fromSlug: prereqSlug,
        toSlug: dependentSlug,
        confidence: node.confidence ?? 0.85,
      });
    }
  }

  // 3. Cycle Detection & Deterministic Repair Loop
  // Adjacency list: fromSlug -> toSlug[]
  let currentEdges = [...candidateEdges];
  const maxRepairs = 10;
  let repairIterations = 0;

  let cycleEdgeToPrune: ValidatedPrerequisiteEdge | null = null;

  while (repairIterations < maxRepairs) {
    repairIterations++;
    const adj = new Map<string, string[]>();
    for (const slug of validSlugs) {
      adj.set(slug, []);
    }
    for (const edge of currentEdges) {
      adj.get(edge.fromSlug)?.push(edge.toSlug);
    }

    const color = new Map<string, Color>();
    for (const slug of validSlugs) {
      color.set(slug, Color.WHITE);
    }

    let cycleFound = false;
    cycleEdgeToPrune = null;
    const parentMap = new Map<string, string>();

    function dfs(u: string): boolean {
      color.set(u, Color.GRAY);
      const neighbors = adj.get(u) || [];

      for (const v of neighbors) {
        if (color.get(v) === Color.GRAY) {
          // Cycle detected! u -> v is a back-edge
          cycleFound = true;
          // Find the edge in our currentEdges with the lowest confidence along the path or this back-edge
          cycleEdgeToPrune = currentEdges.find((e) => e.fromSlug === u && e.toSlug === v) || null;
          return true;
        }
        if (color.get(v) === Color.WHITE) {
          parentMap.set(v, u);
          if (dfs(v)) return true;
        }
      }

      color.set(u, Color.BLACK);
      return false;
    }

    for (const slug of validSlugs) {
      if (color.get(slug) === Color.WHITE) {
        if (dfs(slug)) break;
      }
    }

    if (!cycleFound) {
      // No cycles remaining! Graph is verified acyclic.
      break;
    }

    // Deterministic Repair: Prune the identified cycle-forming back-edge
    if (cycleEdgeToPrune) {
      const edgeToPrune: ValidatedPrerequisiteEdge = cycleEdgeToPrune;
      diagnostics.push(`Cycle detected involving edge ${edgeToPrune.fromSlug} -> ${edgeToPrune.toSlug}. Deterministically pruning edge.`);
      currentEdges = currentEdges.filter((e) => !(e.fromSlug === edgeToPrune.fromSlug && e.toSlug === edgeToPrune.toSlug));
      repairedEdgesCount++;
    } else {
      diagnostics.push('Cycle detected but edge could not be safely isolated. Aborting repair.');
      return {
        isValid: false,
        nodes: cleanNodes,
        edges: [],
        topologicalOrder: [],
        repairedEdgesCount,
        diagnostics,
      };
    }
  }

  // 4. Topological Sort using Kahn's Algorithm
  const inDegree = new Map<string, number>();
  const outAdj = new Map<string, string[]>();
  for (const slug of validSlugs) {
    inDegree.set(slug, 0);
    outAdj.set(slug, []);
  }

  for (const edge of currentEdges) {
    inDegree.set(edge.toSlug, (inDegree.get(edge.toSlug) || 0) + 1);
    outAdj.get(edge.fromSlug)?.push(edge.toSlug);
  }

  const queue: string[] = [];
  for (const slug of validSlugs) {
    if ((inDegree.get(slug) || 0) === 0) {
      queue.push(slug);
    }
  }

  // Sort initial queue by orderIndex for deterministic tie-breaking
  queue.sort((a, b) => (nodeMap.get(a)?.orderIndex ?? 0) - (nodeMap.get(b)?.orderIndex ?? 0));

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    topologicalOrder.push(u);

    const neighbors = outAdj.get(u) || [];
    for (const v of neighbors) {
      const newInDegree = (inDegree.get(v) || 0) - 1;
      inDegree.set(v, newInDegree);
      if (newInDegree === 0) {
        queue.push(v);
        queue.sort((a, b) => (nodeMap.get(a)?.orderIndex ?? 0) - (nodeMap.get(b)?.orderIndex ?? 0));
      }
    }
  }

  if (topologicalOrder.length !== validSlugs.size) {
    diagnostics.push('Topological sort failed: Graph contains unresolvable circular dependencies.');
    return {
      isValid: false,
      nodes: cleanNodes,
      edges: currentEdges,
      topologicalOrder: [],
      repairedEdgesCount,
      diagnostics,
    };
  }

  // Precompute reverse dependencies: concept -> Set of concepts that depend on it
  const reverseDependencyMap = new Map<string, Set<string>>();
  for (const slug of validSlugs) {
    reverseDependencyMap.set(slug, new Set<string>());
  }
  for (const edge of currentEdges) {
    reverseDependencyMap.get(edge.fromSlug)?.add(edge.toSlug);
  }

  // Precompute dependency depths from roots (longest path in DAG from any root)
  const dependencyDepthMap = new Map<string, number>();
  for (const slug of topologicalOrder) {
    dependencyDepthMap.set(slug, 0);
  }
  for (const u of topologicalOrder) {
    const currentDepth = dependencyDepthMap.get(u) || 0;
    const dependents = reverseDependencyMap.get(u) || new Set<string>();
    for (const v of dependents) {
      const existingDepth = dependencyDepthMap.get(v) || 0;
      if (currentDepth + 1 > existingDepth) {
        dependencyDepthMap.set(v, currentDepth + 1);
      }
    }
  }

  const rootSlugs = Array.from(validSlugs).filter((slug) => (inDegree.get(slug) || 0) === 0);
  const leafSlugs = Array.from(validSlugs).filter(
    (slug) => (reverseDependencyMap.get(slug)?.size || 0) === 0
  );

  diagnostics.push(`Verified DAG produced with ${cleanNodes.length} nodes and ${currentEdges.length} prerequisite edges.`);

  return {
    isValid: true,
    nodes: cleanNodes,
    edges: currentEdges,
    topologicalOrder,
    repairedEdgesCount,
    diagnostics,
    reverseDependencyMap,
    dependencyDepthMap,
    rootSlugs,
    leafSlugs,
  };
}

/**
 * Given a changed concept slug and the precomputed reverse dependency index,
 * returns the exact set of downstream concept slugs that are transitively affected.
 * Avoids full graph recomputation.
 */
export function getDownstreamAffectedRegion(
  changedSlug: string,
  reverseDependencyMap: Map<string, Set<string>>
): Set<string> {
  const affected = new Set<string>();
  const queue: string[] = [changedSlug];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const dependents = reverseDependencyMap.get(current);
    if (dependents) {
      for (const dep of dependents) {
        if (!affected.has(dep)) {
          affected.add(dep);
          queue.push(dep);
        }
      }
    }
  }

  return affected;
}

