// ============================================================================
// Deterministic Duration Engine
// Specification Section 14:
// Priority:
// 1. Explicit creator duration (e.g. "5 days" -> 5)
// 2. User-selected duration from preferences
// 3. Derived optimal duration based on places & daily capacity
// ============================================================================

import { ExtractedDuration, ExtractedPlaceEvidence } from '../types/travelVideoPipeline';

export interface DurationEstimationResult {
  durationDays: number;
  source: 'creator_explicit' | 'user_selected' | 'derived_optimal';
  totalEstimatedHours: number;
  averageHoursPerDay: number;
  pace: 'relaxed' | 'balanced' | 'fast';
  notes: string;
}

export class DurationEngine {
  /**
   * Calculates optimal duration in days
   */
  public static calculateDuration(
    extractedDuration: ExtractedDuration,
    places: ExtractedPlaceEvidence[],
    userPace: 'relaxed' | 'balanced' | 'fast' = 'balanced',
    userSelectedDays?: number
  ): DurationEstimationResult {
    // 1. Priority 1: Explicit Creator Duration
    if (extractedDuration?.explicit && extractedDuration.days && extractedDuration.days > 0) {
      const days = Math.min(Math.max(extractedDuration.days, 1), 14);
      return {
        durationDays: days,
        source: 'creator_explicit',
        totalEstimatedHours: days * 7.5,
        averageHoursPerDay: 7.5,
        pace: userPace,
        notes: `Trip duration matches explicit recommendation from video (${days} days).`,
      };
    }

    // 2. Priority 2: User Preferred Duration
    if (userSelectedDays && userSelectedDays > 0) {
      const days = Math.min(Math.max(userSelectedDays, 1), 14);
      return {
        durationDays: days,
        source: 'user_selected',
        totalEstimatedHours: days * 7.0,
        averageHoursPerDay: 7.0,
        pace: userPace,
        notes: `Trip duration configured to your preference (${days} days).`,
      };
    }

    // 3. Priority 3: Derived Optimal Duration based on Places & Realistic Daily Capacity
    // Daily usable activity budget:
    // - Relaxed: 5.5 to 6.5 hours/day
    // - Balanced: 7.0 to 8.0 hours/day
    // - Fast: 8.5 to 9.5 hours/day
    const dailyTargetHours = userPace === 'relaxed' ? 6.0 : userPace === 'fast' ? 9.0 : 7.5;

    // Sum visit minutes + standard transit buffers (30m between sights, 60m inter-city)
    const placeCount = places.length;
    let totalMinutes = 0;

    places.forEach((p, idx) => {
      const visitTime = p.estimatedVisitMinutes || 90;
      const transitTime = idx === 0 ? 30 : 40; // travel from previous sight
      totalMinutes += visitTime + transitTime;
    });

    // Add buffer for meals and arrival/departure (120 mins)
    totalMinutes += Math.max(placeCount, 1) * 30;

    const totalHours = totalMinutes / 60;

    // Calculate days needed without overloading (bin-packing into daily usable hours)
    let calculatedDays = Math.ceil(totalHours / dailyTargetHours);

    // Realistic bounds: at least 2 places per day on average, minimum 1 day, max 10 days
    if (placeCount <= 2) calculatedDays = 1;
    else if (placeCount <= 4) calculatedDays = 2;
    else if (placeCount <= 7) calculatedDays = 3;
    else if (placeCount <= 10) calculatedDays = 4;
    else if (placeCount <= 14) calculatedDays = 5;
    else calculatedDays = Math.min(Math.ceil(placeCount / 2.5), 10);

    const safeDays = Math.max(1, Math.min(calculatedDays, 10));
    const avgHours = Number((totalHours / safeDays).toFixed(1));

    return {
      durationDays: safeDays,
      source: 'derived_optimal',
      totalEstimatedHours: Number(totalHours.toFixed(1)),
      averageHoursPerDay: avgHours,
      pace: userPace,
      notes: `Optimal ${safeDays}-day duration derived deterministically from ${placeCount} places (${avgHours}h sightseeing/day).`,
    };
  }
}
