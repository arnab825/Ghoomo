/**
 * Ghoomo In-Memory Sliding Window Rate Limiter
 * Enforces: Max 5 itinerary generations per hour per user.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  error?: string;
}

const MAX_GENERATIONS_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkItineraryRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const userKey = userId || 'anonymous_default_user';

  let record = rateLimitStore.get(userKey);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(userKey, record);
  }

  // Filter out timestamps older than the sliding window (1 hour)
  record.timestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS);

  if (record.timestamps.length >= MAX_GENERATIONS_PER_HOUR) {
    const oldestTimestamp = record.timestamps[0];
    const resetSeconds = Math.ceil((oldestTimestamp + WINDOW_MS - now) / 1000);
    const resetMinutes = Math.max(1, Math.ceil(resetSeconds / 60));

    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
      error: `You have reached the limit of ${MAX_GENERATIONS_PER_HOUR} smart trip plan generations per hour. Please wait ${resetMinutes} minute${resetMinutes === 1 ? '' : 's'} before generating again.`,
    };
  }

  // Record this consumption
  record.timestamps.push(now);

  const remaining = MAX_GENERATIONS_PER_HOUR - record.timestamps.length;
  const oldestTimestamp = record.timestamps[0];
  const resetSeconds = Math.ceil((oldestTimestamp + WINDOW_MS - now) / 1000);

  return {
    allowed: true,
    remaining,
    resetSeconds,
  };
}

/**
 * Reset rate limit for a user (useful for test suites or admin overrides).
 */
export function resetRateLimit(userId: string): void {
  rateLimitStore.delete(userId || 'anonymous_default_user');
}
