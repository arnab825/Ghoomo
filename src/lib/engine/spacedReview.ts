/**
 * Ghoomo Spaced Review Engine
 * Deterministic SM-2 variant for evidence-based review scheduling.
 * No ML model required — pure math-driven intervals.
 */

export interface ReviewState {
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
}

export interface ReviewResult {
  newIntervalDays: number;
  newEaseFactor: number;
  newReviewCount: number;
  nextReviewAt: Date;
}

/**
 * SM-2 inspired review scheduling.
 *
 * @param current - Current review state for this concept
 * @param quality - 0-5 quality rating:
 *   5 = perfect recall, no hesitation
 *   4 = correct with slight hesitation
 *   3 = correct with significant difficulty
 *   2 = incorrect but close / partial recall
 *   1 = incorrect, barely remembered anything
 *   0 = complete blackout
 *
 * Returns the next review interval and updated ease factor.
 */
export function calculateNextReview(
  current: ReviewState,
  quality: number
): ReviewResult {
  // Clamp quality to 0-5
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  // Update ease factor using SM-2 formula
  let newEaseFactor = current.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor); // Floor at 1.3

  let newIntervalDays: number;
  const newReviewCount = current.reviewCount + 1;

  if (q < 3) {
    // Failed: reset interval to 1 day (immediate re-review)
    newIntervalDays = 1;
  } else if (newReviewCount === 1) {
    newIntervalDays = 1;
  } else if (newReviewCount === 2) {
    newIntervalDays = 3;
  } else {
    newIntervalDays = Math.round(current.intervalDays * newEaseFactor);
  }

  // Cap maximum interval at 90 days
  newIntervalDays = Math.min(90, Math.max(1, newIntervalDays));

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newIntervalDays);

  return {
    newIntervalDays,
    newEaseFactor: Math.round(newEaseFactor * 100) / 100,
    newReviewCount,
    nextReviewAt,
  };
}

/**
 * Maps mastery policy assessment results to SM-2 quality rating.
 */
export function mapScoreToQuality(params: {
  isCorrect: boolean;
  score: number;         // 0-100
  isMisconception: boolean;
  timeSpentSeconds: number;
  expectedSeconds?: number;
}): number {
  if (params.isMisconception) return 0; // Misconception = complete failure
  if (!params.isCorrect) return 2;       // Wrong but attempted

  // Correct: map score and speed to 3-5
  if (params.score >= 95) return 5;      // Perfect
  if (params.score >= 85) return 4;      // Good
  return 3;                               // Correct but struggled
}

/**
 * Identifies concepts due for review for a given user.
 * Returns concept IDs sorted by urgency (most overdue first).
 */
export function getOverdueReviews(
  schedules: Array<{
    conceptId: string;
    nextReviewAt: string;
    intervalDays: number;
  }>,
  now: Date = new Date()
): Array<{ conceptId: string; daysOverdue: number; urgencyScore: number }> {
  const overdue: Array<{ conceptId: string; daysOverdue: number; urgencyScore: number }> = [];

  for (const s of schedules) {
    const reviewDate = new Date(s.nextReviewAt);
    if (reviewDate <= now) {
      const daysOverdue = Math.max(0, Math.round((now.getTime() - reviewDate.getTime()) / 86400000));
      // Urgency increases with overdue time and decreases with longer intervals
      // (concepts with shorter intervals are more fragile)
      const urgencyScore = (daysOverdue + 1) / Math.max(1, s.intervalDays);
      overdue.push({ conceptId: s.conceptId, daysOverdue, urgencyScore });
    }
  }

  // Sort by urgency: most urgent first
  overdue.sort((a, b) => b.urgencyScore - a.urgencyScore);
  return overdue;
}
