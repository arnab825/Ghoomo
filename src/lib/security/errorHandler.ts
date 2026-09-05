import { NextResponse } from 'next/server';

/**
 * Production-Grade Error Handler Utility
 * 
 * Strict Security Guardrails:
 * 1. Users NEVER see stack traces, internal file paths, or raw database/network errors.
 * 2. Full error details (stack, message, cause, context, timestamps) are logged server-side for developer debugging.
 * 3. Client receives consistent, clean, and safe error responses.
 */

export interface SafeErrorResponse {
  success: false;
  error: string;
}

/**
 * Handles API route errors by logging full details server-side
 * and returning a sanitized generic message to the client.
 */
export function handleApiError(
  error: unknown,
  contextName: string,
  userFacingMessage: string = 'An unexpected error occurred. Please try again later.',
  statusCode: number = 500
): NextResponse<SafeErrorResponse> {
  const timestamp = new Date().toISOString();
  const errorObj = error instanceof Error ? error : new Error(String(error));

  // Server-side logging: Full diagnostic information for developers
  console.error(`[SERVER_ERROR ${timestamp}] [${contextName}]:`, {
    name: errorObj.name,
    message: errorObj.message,
    stack: errorObj.stack,
    cause: (errorObj as any).cause,
    raw: error,
  });

  // Client response: Generic, safe message with zero internal details
  return NextResponse.json(
    {
      success: false,
      error: userFacingMessage,
    },
    { status: statusCode }
  );
}
