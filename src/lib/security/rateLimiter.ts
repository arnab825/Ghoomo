/**
 * EduSpark Multi-Tier Sliding Window Rate Limiter
 * 
 * Implements:
 * 1. Auth Tier: Strict per-IP and per-account limiting with exponential backoff delay (no hard lockout).
 * 2. Public Tier: Moderate sliding-window IP throttling.
 * 3. Authenticated Tier: Generous sliding-window per-user throttling.
 * All thresholds are centrally configured in securityConfig.
 */

import { securityConfig } from '../config/securityConfig';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  backoffSeconds?: number;
  error?: string;
}

interface WindowRecord {
  timestamps: number[];
}

interface AuthAttemptRecord {
  failedCount: number;
  lastAttemptTime: number;
  blockedUntilTime: number;
}

// In-memory sliding window stores
const publicWindowStore = new Map<string, WindowRecord>();
const authenticatedWindowStore = new Map<string, WindowRecord>();
const authAttemptStore = new Map<string, AuthAttemptRecord>();

/**
 * Checks sliding window limits for a given store.
 */
function checkSlidingWindow(
  store: Map<string, WindowRecord>,
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let record = store.get(key);

  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Remove timestamps outside the sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
      error: `Rate limit exceeded. Please wait ${resetSeconds}s before trying again.`,
    };
  }

  // Record this request
  record.timestamps.push(now);
  const remaining = maxRequests - record.timestamps.length;
  const oldest = record.timestamps[0];
  const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));

  return {
    allowed: true,
    remaining,
    resetSeconds,
  };
}

/**
 * Rate limiter for public endpoints (per-IP).
 */
export function checkPublicRateLimit(clientIp: string): RateLimitResult {
  const key = clientIp || 'anonymous_public';
  return checkSlidingWindow(
    publicWindowStore,
    key,
    securityConfig.public.maxRequests,
    securityConfig.public.windowMs
  );
}

/**
 * Rate limiter for authenticated learner actions (per-user).
 */
export function checkAuthenticatedRateLimit(userId: string): RateLimitResult {
  const key = userId || 'anonymous_authenticated';
  return checkSlidingWindow(
    authenticatedWindowStore,
    key,
    securityConfig.authenticated.maxRequests,
    securityConfig.authenticated.windowMs
  );
}

/**
 * Strict rate limiter for authentication routes (login, signup, password reset).
 * Uses a combined per-IP and per-account key with exponential backoff delay instead of hard lockout.
 */
export function checkAuthRateLimit(params: {
  clientIp: string;
  accountEmail?: string;
}): RateLimitResult {
  const now = Date.now();
  const normalizedEmail = params.accountEmail ? params.accountEmail.trim().toLowerCase() : 'unknown';
  const ip = params.clientIp || '127.0.0.1';

  // Check both IP key and compound IP+Email key
  const keys = [`ip:${ip}`, `account:${ip}:${normalizedEmail}`];

  for (const key of keys) {
    const record = authAttemptStore.get(key);
    if (record && now < record.blockedUntilTime) {
      const waitSeconds = Math.max(1, Math.ceil((record.blockedUntilTime - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetSeconds: waitSeconds,
        backoffSeconds: waitSeconds,
        error: `Too many sign-in attempts. Please wait ${waitSeconds} second${waitSeconds === 1 ? '' : 's'} before retrying.`,
      };
    }
  }

  return {
    allowed: true,
    remaining: securityConfig.auth.maxAttempts,
    resetSeconds: Math.ceil(securityConfig.auth.windowMs / 1000),
  };
}

/**
 * Records a failed authentication attempt and calculates exponential backoff delay.
 */
export function recordAuthFailure(params: {
  clientIp: string;
  accountEmail?: string;
}): { backoffSeconds: number } {
  const now = Date.now();
  const normalizedEmail = params.accountEmail ? params.accountEmail.trim().toLowerCase() : 'unknown';
  const ip = params.clientIp || '127.0.0.1';
  const key = `account:${ip}:${normalizedEmail}`;

  const record = authAttemptStore.get(key) || {
    failedCount: 0,
    lastAttemptTime: now,
    blockedUntilTime: 0,
  };

  record.failedCount += 1;
  record.lastAttemptTime = now;

  // Exponential backoff calculation: baseBackoff * 2^(failedCount - 1)
  // e.g. Attempt 1: 2s, Attempt 2: 4s, Attempt 3: 8s, Attempt 4: 16s... up to maxBackoff
  const exponent = Math.max(0, record.failedCount - 1);
  const calculatedSeconds = securityConfig.auth.baseBackoffSeconds * Math.pow(2, exponent);
  const backoffSeconds = Math.min(calculatedSeconds, securityConfig.auth.maxBackoffSeconds);

  record.blockedUntilTime = now + backoffSeconds * 1000;
  authAttemptStore.set(key, record);
  authAttemptStore.set(`ip:${ip}`, record);

  return { backoffSeconds };
}

/**
 * Resets failed authentication records upon successful login.
 */
export function recordAuthSuccess(params: {
  clientIp: string;
  accountEmail?: string;
}): void {
  const normalizedEmail = params.accountEmail ? params.accountEmail.trim().toLowerCase() : 'unknown';
  const ip = params.clientIp || '127.0.0.1';

  authAttemptStore.delete(`account:${ip}:${normalizedEmail}`);
  authAttemptStore.delete(`ip:${ip}`);
}

/**
 * Clears stores for testing purposes.
 */
export function resetAllRateLimits(): void {
  publicWindowStore.clear();
  authenticatedWindowStore.clear();
  authAttemptStore.clear();
}
