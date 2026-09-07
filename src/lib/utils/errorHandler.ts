import { ZodError } from 'zod';

/**
 * Production Safe Error Handler
 * Guarantees that internal stack traces, file paths, and raw database errors
 * are never exposed to the client, while preserving full diagnostic logs on the server.
 */

export interface SafeErrorResponse {
  success: false;
  error: string;
}

/**
 * Maps raw system and database errors to clean, safe user-facing explanations.
 */
export function formatSafeUserError(
  err: unknown,
  fallbackMessage = 'Unable to complete this request. Please try again.'
): string {
  if (!err) return fallbackMessage;

  // 1. Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    if (firstIssue) {
      return firstIssue.message || 'Invalid input provided.';
    }
    return 'Input validation failed. Please check your entries.';
  }

  // 2. Standard Error instance inspection
  const rawMessage = typeof err === 'string' ? err : (err as any)?.message || '';

  // 3. Known Supabase / Auth error mappings
  if (rawMessage.includes('Invalid login credentials')) {
    return 'Incorrect email address or password. Please try again.';
  }
  if (rawMessage.includes('User already registered') || rawMessage.includes('already exists')) {
    return 'An account with this email address already exists.';
  }
  if (rawMessage.includes('Password should be at least')) {
    return 'Password must be at least 8 characters long.';
  }
  if (rawMessage.includes('JWT') || rawMessage.includes('token is expired') || rawMessage.includes('session')) {
    return 'Your session has expired. Please sign in again.';
  }

  // 4. Raw Database / SQL / Infrastructure error protection
  // Any error containing PostgreSQL codes, schema names, or column references must be masked
  const containsDbJargon =
    /postgres|relation|column|syntax error|constraint|violates|supabase|schema cache|pgrst/i.test(rawMessage);

  if (containsDbJargon) {
    return 'A database service error occurred. Our team has been notified.';
  }

  // 5. Rate limit messages can pass through safely
  if (rawMessage.includes('Rate limit') || rawMessage.includes('Too many')) {
    return rawMessage;
  }

  // 6. Generic fallback if message appears safe and short (under 120 chars, no file paths)
  if (rawMessage && rawMessage.length <= 120 && !rawMessage.includes('/') && !rawMessage.includes('\\')) {
    return rawMessage;
  }

  return fallbackMessage;
}

/**
 * Logs full diagnostic detail server-side and returns a safe error payload for Server Actions.
 */
export function handleServerActionError(actionName: string, err: unknown): SafeErrorResponse {
  const timestamp = new Date().toISOString();
  console.error(`[Server Action Error] [${timestamp}] in ${actionName}:`, err);

  const safeMessage = formatSafeUserError(err);
  return {
    success: false,
    error: safeMessage,
  };
}

/**
 * Handles API Route errors by logging full server-side diagnostics
 * and returning a sanitized generic response to the client.
 */
export function handleApiError(
  error: unknown,
  contextName: string,
  userFacingMessage: string = 'An unexpected error occurred. Please try again later.',
  statusCode: number = 500
): Response {
  const timestamp = new Date().toISOString();
  console.error(`[API Route Error] [${timestamp}] in ${contextName}:`, error);

  const safeMessage = formatSafeUserError(error, userFacingMessage);
  return new Response(
    JSON.stringify({
      success: false,
      error: safeMessage,
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
