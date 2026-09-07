/**
 * Ghoomo Resilient Fetch Layer
 * Wraps Supabase queries with retry, timeout, fallback, and error classification.
 * Respects Vercel free-tier 10s serverless limit (8s query budget).
 */

export type ErrorClass =
  | 'AUTH_EXPIRED'
  | 'AUTH_FORBIDDEN'
  | 'NETWORK_OFFLINE'
  | 'NETWORK_TIMEOUT'
  | 'DB_WRITE_FAILED'
  | 'DB_READ_FAILED'
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'QUOTA_EXCEEDED'
  | 'UNKNOWN';

export interface ResilientResult<T> {
  data: T | null;
  fromCache: boolean;
  error: string | null;
  errorClass: ErrorClass | null;
}

interface ResilientOptions<T> {
  /** Maximum retries on failure. Default: 1 */
  retries?: number;
  /** Timeout in ms. Default: 8000 */
  timeoutMs?: number;
  /** Cached fallback data to serve on failure */
  fallbackData?: T;
  /** Callback for UI retry feedback */
  onRetry?: (attempt: number) => void;
  /** Callback for error classification */
  onError?: (errorClass: ErrorClass, message: string) => void;
}

/**
 * Classifies Supabase/network errors into actionable categories.
 */
export function classifyError(error: unknown): { errorClass: ErrorClass; message: string } {
  if (!error) return { errorClass: 'UNKNOWN', message: 'Unknown error' };

  const err = error as Record<string, unknown>;
  const message = (err.message as string) || String(error);
  const code = (err.code as string) || '';
  const status = (err.status as number) || 0;
  const statusCode = (err.statusCode as number) || status;

  // Auth errors
  if (
    statusCode === 401 ||
    code === 'PGRST301' ||
    message.includes('JWT') ||
    message.includes('not authenticated') ||
    message.includes('session')
  ) {
    return { errorClass: 'AUTH_EXPIRED', message: 'Session expired. Please sign in again.' };
  }

  if (statusCode === 403 || code === '42501' || message.includes('permission denied')) {
    return { errorClass: 'AUTH_FORBIDDEN', message: "You don't have access to this resource." };
  }

  // Network errors
  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ERR_INTERNET_DISCONNECTED') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  ) {
    return { errorClass: 'NETWORK_OFFLINE', message: "You're offline. Changes will sync when reconnected." };
  }

  if (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('aborted')) {
    return { errorClass: 'NETWORK_TIMEOUT', message: 'Request timed out. Retrying...' };
  }

  // Not found
  if (statusCode === 404 || code === 'PGRST116' || message.includes('not found')) {
    return { errorClass: 'NOT_FOUND', message: 'Resource not found.' };
  }

  // Quota
  if (statusCode === 429 || message.includes('rate limit') || message.includes('quota')) {
    return { errorClass: 'QUOTA_EXCEEDED', message: 'Rate limit reached. Please wait a moment.' };
  }

  // Validation
  if (code === '23505' || code === '23503' || code === '23514' || message.includes('constraint')) {
    return { errorClass: 'VALIDATION_FAILED', message: 'Invalid data. Please check your input.' };
  }

  // Generic DB errors
  if (code.startsWith('P') || code.startsWith('2')) {
    return { errorClass: 'DB_READ_FAILED', message: 'Database error. Please try again.' };
  }

  return { errorClass: 'UNKNOWN', message: message || 'Something went wrong.' };
}

/**
 * Executes a Supabase query with retry, timeout, and error handling.
 */
export async function resilientQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  options: ResilientOptions<T> = {}
): Promise<ResilientResult<T>> {
  const { retries = 1, timeoutMs = 8000, fallbackData, onRetry, onError } = options;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      onRetry?.(attempt);
      // Exponential backoff: 200ms, 400ms
      await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt - 1)));
    }

    try {
      const result = await Promise.race([
        queryFn(),
        new Promise<{ data: null; error: { message: string } }>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
        ),
      ]);

      if (result.error) {
        lastError = result.error;
        const { errorClass, message } = classifyError(result.error);

        // Don't retry auth errors or not-found
        if (errorClass === 'AUTH_EXPIRED' || errorClass === 'AUTH_FORBIDDEN' || errorClass === 'NOT_FOUND') {
          onError?.(errorClass, message);
          return {
            data: fallbackData ?? null,
            fromCache: !!fallbackData,
            error: message,
            errorClass,
          };
        }

        continue; // Retry on other errors
      }

      return { data: result.data, fromCache: false, error: null, errorClass: null };
    } catch (err) {
      lastError = err;
    }
  }

  // All retries exhausted
  const { errorClass, message } = classifyError(lastError);
  onError?.(errorClass, message);

  return {
    data: fallbackData ?? null,
    fromCache: !!fallbackData,
    error: message,
    errorClass,
  };
}

/**
 * Wraps a server action with error classification.
 * Useful for client-side calls to server actions.
 */
export async function resilientAction<T>(
  actionFn: () => Promise<T>,
  options: { timeoutMs?: number; onError?: (errorClass: ErrorClass, message: string) => void } = {}
): Promise<{ data: T | null; error: string | null; errorClass: ErrorClass | null }> {
  const { timeoutMs = 8000, onError } = options;

  try {
    const result = await Promise.race([
      actionFn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Action timeout')), timeoutMs)
      ),
    ]);

    return { data: result, error: null, errorClass: null };
  } catch (err) {
    const { errorClass, message } = classifyError(err);
    onError?.(errorClass, message);
    return { data: null, error: message, errorClass };
  }
}
