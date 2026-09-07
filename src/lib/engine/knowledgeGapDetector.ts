/**
 * Ghoomo Knowledge Gap Detector
 * Standalone engine service that evaluates learner epistemic state against the validated DAG.
 * Does NOT choose the Next Best Action; provides objective structural facts to the route planner.
 */

import { Concept, ConceptPrerequisite, LearnerConceptState, Misconception, GapAnalysisResult } from '../types/engine';

export function detectKnowledgeGaps(params: {
  concepts: Concept[];
  prerequisites: ConceptPrerequisite[];
  learnerStates: Map<string, LearnerConceptState>;
  misconceptions: Misconception[];
}): GapAnalysisResult {
  const { concepts, prerequisites, learnerStates, misconceptions } = params;

  // Build prerequisite lookup: conceptId -> set of prerequisiteConceptIds
  const prereqMap = new Map<string, Set<string>>();
  for (const c of concepts) {
    prereqMap.set(c.id, new Set<string>());
  }
  for (const edge of prerequisites) {
    prereqMap.get(edge.conceptId)?.add(edge.prerequisiteConceptId);
  }

  const blockedConcepts = new Set<string>();
  const missingPrerequisites = new Set<string>();
  const weakConcepts = new Set<string>();
  const unresolvedMisconceptions = new Set<string>();
  const safelySkippableConcepts = new Set<string>();
  const readyEligibleConcepts = new Set<string>();

  // 1. Identify active unresolved misconceptions
  for (const m of misconceptions) {
    if (!m.isResolved) {
      unresolvedMisconceptions.add(m.conceptId);
    }
  }

  // 2. Evaluate each concept's state
  for (const c of concepts) {
    const state = learnerStates.get(c.id);
    const stateType = state?.state ?? 'UNKNOWN';
    const masteryScore = state?.masteryScore ?? 0;

    if (stateType === 'NEEDS_REVIEW') {
      unresolvedMisconceptions.add(c.id);
    } else if (stateType === 'MASTERED' || stateType === 'PROVISIONALLY_READY') {
      safelySkippableConcepts.add(c.id);
    } else if (stateType === 'DEVELOPING' || (stateType === 'EXPOSED' && masteryScore < 70)) {
      weakConcepts.add(c.id);
    }
  }

  // 3. Evaluate prerequisites and blocks
  const prereqSatisfactionMemo = new Map<string, boolean>();
  for (const c of concepts) {
    // If already fully mastered or provisionally ready, it is cleared
    if (safelySkippableConcepts.has(c.id)) {
      continue;
    }

    const requiredPrereqs = prereqMap.get(c.id) || new Set<string>();
    let isBlocked = false;

    for (const prereqId of requiredPrereqs) {
      let isPrereqSatisfied = prereqSatisfactionMemo.get(prereqId);
      if (isPrereqSatisfied === undefined) {
        const prereqState = learnerStates.get(prereqId);
        isPrereqSatisfied =
          prereqState?.state === 'MASTERED' ||
          prereqState?.state === 'PROVISIONALLY_READY';
        prereqSatisfactionMemo.set(prereqId, isPrereqSatisfied);
      }

      if (!isPrereqSatisfied) {
        isBlocked = true;
        missingPrerequisites.add(prereqId);
      }
    }

    if (isBlocked) {
      blockedConcepts.add(c.id);
    } else {
      // Not blocked and not already skippable -> Ready for action!
      readyEligibleConcepts.add(c.id);
    }
  }

  return {
    blockedConcepts: Array.from(blockedConcepts),
    missingPrerequisites: Array.from(missingPrerequisites),
    weakConcepts: Array.from(weakConcepts),
    unresolvedMisconceptions: Array.from(unresolvedMisconceptions),
    safelySkippableConcepts: Array.from(safelySkippableConcepts),
    readyEligibleConcepts: Array.from(readyEligibleConcepts),
  };
}
