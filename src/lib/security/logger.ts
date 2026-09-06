/**
 * Ghoomo Safe Diagnostic Logger
 * Safely logs failures, timeouts, and validation errors on the server
 * without leaking sensitive API keys or crashing client interfaces.
 */

export interface LogEntry {
  timestamp: string;
  context: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, any>;
}

export function safeLog(
  level: 'info' | 'warn' | 'error',
  context: string,
  message: string,
  metadata?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();

  // Strip sensitive tokens from metadata
  const safeMeta = metadata ? { ...metadata } : undefined;
  if (safeMeta) {
    for (const key of Object.keys(safeMeta)) {
      if (
        key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('auth') ||
        key.toLowerCase().includes('password')
      ) {
        safeMeta[key] = '[REDACTED]';
      }
    }
  }

  const logPayload = {
    timestamp,
    context,
    level,
    message,
    ...(safeMeta ? { metadata: safeMeta } : {}),
  };

  if (level === 'error') {
    console.error(`[Ghoomo:${context}] ❌ ${message}`, safeMeta || '');
  } else if (level === 'warn') {
    console.warn(`[Ghoomo:${context}] ⚠️ ${message}`, safeMeta || '');
  } else {
    console.log(`[Ghoomo:${context}] ℹ️ ${message}`, safeMeta || '');
  }
}
