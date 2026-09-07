/**
 * Ghoomo Learning Efficiency Calculator
 * Computes deterministic, auditable efficiency metrics based on actual learner state.
 * Aligned with SIH 2026 Problem Statement 26207:
 * "Enables learners to learn more effectively, efficiently, flexibly and comfortably."
 *
 * NO FABRICATED OR HARDCODED CLAIMS.
 * Uses exact counts from the learner's knowledge graph and persisted activities.
 */

import { LearnerConceptState, LearningActivity, LearningEfficiencyMetric } from '../types/engine';

export interface ComputeEfficiencyParams {
  baselineActivityCount: number;
  allActivities: LearningActivity[];
  learnerStates: Map<string, LearnerConceptState>;
  remediationActivitiesCount?: number;
}

export function computeLearningEfficiency(params: ComputeEfficiencyParams): LearningEfficiencyMetric {
  const {
    baselineActivityCount,
    allActivities,
    learnerStates,
    remediationActivitiesCount = 0,
  } = params;

  let avoidedCount = 0;
  let estimatedMinutesAvoided = 0;

  // Identify activities for concepts where learner demonstrated prior mastery / provisional readiness
  for (const activity of allActivities) {
    // Remediation activities are by definition not avoidable prior steps
    if (activity.isRemediation) continue;

    const state = learnerStates.get(activity.conceptId);
    if (state && (state.state === 'MASTERED' || state.state === 'PROVISIONALLY_READY')) {
      avoidedCount++;
      estimatedMinutesAvoided += (activity.durationMinutes || 10);
    }
  }

  const personalizedCount = Math.max(
    1,
    baselineActivityCount - avoidedCount + remediationActivitiesCount
  );

  const reason = avoidedCount > 0
    ? `Skipped ${avoidedCount} baseline activities (${estimatedMinutesAvoided} min) due to verified diagnostic competence and mastery.`
    : 'No activities skipped yet; completing foundational diagnostic verification.';

  return {
    baselineActivityCount,
    personalizedActivityCount: personalizedCount,
    avoidedActivityCount: avoidedCount,
    estimatedMinutesAvoided,
    reason,
  };
}
