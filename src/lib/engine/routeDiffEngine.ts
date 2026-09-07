/**
 * Ghoomo Route Diff Engine
 * Calculates the exact delta between the planned route before and after an adaptive event.
 */

import { Concept, RouteDiff, RouteSequenceNode, ActivityType } from '../types/engine';

export function computeRouteDiff(params: {
  triggerReason: string;
  triggerConceptName: string;
  concepts: Concept[];
  remediationTitle?: string;
  remediationDurationMinutes?: number;
  nextActionTitle: string;
}): RouteDiff {
  const {
    triggerReason,
    triggerConceptName,
    concepts,
    remediationTitle,
    remediationDurationMinutes = 3,
    nextActionTitle,
  } = params;

  // Build baseline Before sequence
  const beforeSequence: RouteSequenceNode[] = concepts.map((c) => ({
    conceptId: c.id,
    conceptName: c.name,
    activityType: 'PRACTICE' as ActivityType,
    isInserted: false,
  }));

  // Build After sequence with inserted remediation
  const afterSequence: RouteSequenceNode[] = [];
  let inserted = false;

  for (const c of concepts) {
    if (c.name.toLowerCase() === triggerConceptName.toLowerCase() && !inserted) {
      afterSequence.push({
        conceptId: `remed-${c.id}`,
        conceptName: remediationTitle ? `Remediation: ${remediationTitle}` : `Review: ${c.name}`,
        activityType: 'REMEDIATE' as ActivityType,
        isInserted: true,
      });
      inserted = true;
    }
    afterSequence.push({
      conceptId: c.id,
      conceptName: c.name,
      activityType: 'PRACTICE' as ActivityType,
      isInserted: false,
    });
  }

  // Fallback if triggerConceptName was not found in array
  if (!inserted) {
    afterSequence.unshift({
      conceptId: 'remed-first',
      conceptName: remediationTitle ? `Remediation: ${remediationTitle}` : `Review: ${triggerConceptName}`,
      activityType: 'REMEDIATE' as ActivityType,
      isInserted: true,
    });
  }

  return {
    triggerReason,
    triggerConceptName,
    beforeSequence,
    afterSequence,
    netDurationChangeMinutes: remediationDurationMinutes,
    nextActionTitle,
  };
}
