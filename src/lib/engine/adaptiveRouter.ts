/**
 * Ghoomo Deterministic Adaptive Route Engine
 * Computes the Next Best Action and user-safe 4-factor decision rationale.
 * Pure deterministic code: given identical epistemic state and DAG, always yields the same result.
 */

import {
  Concept,
  LearningActivity,
  ConceptPrerequisite,
  LearnerConceptState,
  Misconception,
  GapAnalysisResult,
  NextBestAction,
} from '../types/engine';
import { detectKnowledgeGaps } from './knowledgeGapDetector';
import { MinPriorityQueue } from './priorityQueue';

export function getNextBestLearningAction(params: {
  concepts: Concept[];
  activities: LearningActivity[];
  prerequisites: ConceptPrerequisite[];
  learnerStates: Map<string, LearnerConceptState>;
  misconceptions: Misconception[];
  topologicalSlugs?: string[];
}): NextBestAction | null {
  const { concepts, activities, prerequisites, learnerStates, misconceptions } = params;

  if (concepts.length === 0 || activities.length === 0) {
    return null;
  }

  // 1. Run independent gap analysis
  const gapAnalysis: GapAnalysisResult = detectKnowledgeGaps({
    concepts,
    prerequisites,
    learnerStates,
    misconceptions,
  });

  const conceptMap = new Map<string, Concept>();
  for (const c of concepts) {
    conceptMap.set(c.id, c);
  }

  // Helper to find activities for a concept
  const activitiesByConcept = new Map<string, LearningActivity[]>();
  for (const a of activities) {
    if (!activitiesByConcept.has(a.conceptId)) {
      activitiesByConcept.set(a.conceptId, []);
    }
    activitiesByConcept.get(a.conceptId)!.push(a);
  }

  // Priority 1: Unresolved Misconceptions (Highest Priority Remediation)
  if (gapAnalysis.unresolvedMisconceptions.length > 0) {
    const targetConceptId = gapAnalysis.unresolvedMisconceptions[0];
    const targetConcept = conceptMap.get(targetConceptId);
    const conceptActivities = activitiesByConcept.get(targetConceptId) || [];

    // Prioritize remediation activity, or first available activity
    const remediationActivity =
      conceptActivities.find((a) => a.isRemediation || a.type === 'REMEDIATE') ||
      conceptActivities[0];

    if (targetConcept && remediationActivity) {
      const activeMisconception = misconceptions.find(
        (m) => m.conceptId === targetConceptId && !m.isResolved
      );

      return {
        activityId: remediationActivity.id,
        activityTitle: remediationActivity.title,
        activityType: remediationActivity.type,
        conceptId: targetConcept.id,
        conceptName: targetConcept.name,
        estimatedMinutes: remediationActivity.durationMinutes,
        whyThis: activeMisconception
          ? `Targeted remediation: ${activeMisconception.misconceptionTitle}.`
          : `Review required on ${targetConcept.name} to clear fundamental confusion.`,
        whyNow: 'Clearing this misconception is required before any downstream objectives can unlock.',
        whyNotAnother: 'Progressing forward without addressing this error creates compounding confusion in subsequent topics.',
        evidenceFactors: activeMisconception
          ? `Evidence: ${activeMisconception.diagnosis}`
          : 'Triggered by conceptual conflict in recent submission.',
      };
    }
  }

  // Priority 2: Missing Prerequisite (Foundational Gap blocking downstream)
  if (gapAnalysis.missingPrerequisites.length > 0) {
    const missingQueue = new MinPriorityQueue<string>();
    for (const id of gapAnalysis.missingPrerequisites) {
      const order = conceptMap.get(id)?.orderIndex ?? 0;
      missingQueue.push(id, order);
    }

    const prereqConceptId = missingQueue.pop()?.item;
    const prereqConcept = prereqConceptId ? conceptMap.get(prereqConceptId) : null;
    const prereqActivities = prereqConceptId ? activitiesByConcept.get(prereqConceptId) || [] : [];
    const firstActivity = prereqActivities[0];

    if (prereqConcept && firstActivity) {
      return {
        activityId: firstActivity.id,
        activityTitle: firstActivity.title,
        activityType: firstActivity.type,
        conceptId: prereqConcept.id,
        conceptName: prereqConcept.name,
        estimatedMinutes: firstActivity.durationMinutes,
        whyThis: `${prereqConcept.name} is a foundational building block for your goal.`,
        whyNow: 'Downstream advanced concepts are currently blocked until this prerequisite is established.',
        whyNotAnother: 'Other topics depend directly on this foundation.',
        evidenceFactors: 'Diagnostic identified this prerequisite as unassessed or developing.',
      };
    }
  }

  // Priority 3: Ready Eligible Concept (Unblocked and ready to advance)
  if (gapAnalysis.readyEligibleConcepts.length > 0) {
    const readyQueue = new MinPriorityQueue<string>();
    for (const id of gapAnalysis.readyEligibleConcepts) {
      const order = conceptMap.get(id)?.orderIndex ?? 0;
      const state = learnerStates.get(id);
      // Give active DEVELOPING concepts slight priority boost over fresh UNKNOWN concepts
      const stateWeight = state?.state === 'DEVELOPING' ? 0 : 2;
      readyQueue.push(id, order * 10 + stateWeight);
    }

    const eligibleConceptId = readyQueue.pop()?.item;
    const eligibleConcept = eligibleConceptId ? conceptMap.get(eligibleConceptId) : null;
    const eligibleActivities = eligibleConceptId ? activitiesByConcept.get(eligibleConceptId) || [] : [];
    const state = eligibleConceptId ? learnerStates.get(eligibleConceptId) : null;

    // Pick activity based on modality and state: if DEVELOPING -> pick PRACTICE / APPLY, otherwise EXPLAIN
    let selectedActivity = eligibleActivities[0];
    if (state?.state === 'DEVELOPING') {
      selectedActivity =
        eligibleActivities.find((a) => a.type === 'PRACTICE' || a.type === 'APPLY') ||
        eligibleActivities[0];
    }

    if (eligibleConcept && selectedActivity) {
      const stateSummary = state?.state === 'DEVELOPING'
        ? `Current score: ${state.masteryScore}%. Ready for application.`
        : 'All prerequisites verified. Ready to begin.';

      return {
        activityId: selectedActivity.id,
        activityTitle: selectedActivity.title,
        activityType: selectedActivity.type,
        conceptId: eligibleConcept.id,
        conceptName: eligibleConcept.name,
        estimatedMinutes: selectedActivity.durationMinutes,
        whyThis: `You have demonstrated all necessary prerequisites for ${eligibleConcept.name}.`,
        whyNow: 'This is your immediate unblocked milestone on the optimal path toward your goal.',
        whyNotAnother: 'Prior concepts have achieved sufficient evidence; later topics remain locked.',
        evidenceFactors: stateSummary,
      };
    }
  }

  // Priority 4: Capstone Prover Task (All concepts mastered or skippable)
  const capstoneConcept = concepts[concepts.length - 1];
  const capstoneActivities = activitiesByConcept.get(capstoneConcept.id) || [];
  const proveActivity =
    capstoneActivities.find((a) => a.type === 'PROVE' || a.type === 'APPLY') ||
    capstoneActivities[0] ||
    activities[0];

  return {
    activityId: proveActivity.id,
    activityTitle: proveActivity.title,
    activityType: proveActivity.type,
    conceptId: capstoneConcept.id,
    conceptName: capstoneConcept.name,
    estimatedMinutes: proveActivity.durationMinutes,
    whyThis: `Capstone verification for your goal: ${capstoneConcept.name}.`,
    whyNow: 'All supporting concepts have reached mastery thresholds.',
    whyNotAnother: 'You have completed all prerequisite milestones.',
    evidenceFactors: 'Evidence across all concept nodes demonstrates verified readiness.',
  };
}
