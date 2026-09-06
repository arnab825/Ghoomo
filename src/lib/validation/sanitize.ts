/**
 * Ghoomo Input & Prompt Sanitizer
 * Neutralizes prompt injection, strips dangerous characters,
 * and formats untrusted scraped text safely before sending to LLMs.
 */

// Common prompt injection attack signatures
const INJECTION_PATTERNS = [
  /\[SYSTEM\]/gi,
  /\[\/SYSTEM\]/gi,
  /SYSTEM PROMPT:/gi,
  /ignore previous instructions/gi,
  /ignore all previous instructions/gi,
  /ignore the above/gi,
  /disregard previous instructions/gi,
  /you are now a/gi,
  /act as a/gi,
  /override system/gi,
  /bypass security/gi,
  /Human:/gi,
  /Assistant:/gi,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
];

/**
 * Sanitizes untrusted user strings or scraped text.
 * @param text The input string to sanitize.
 * @param maxLength Maximum allowable characters (defaults to 4000).
 */
export function sanitizePromptText(text: string, maxLength = 4000): string {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text;

  // 1. Strip null bytes & control characters except standard whitespace
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 2. Strip HTML tags
  sanitized = sanitized.replace(/<\/?[^>]+(>|$)/g, ' ');

  // 3. Neutralize known prompt injection attempts by replacing keywords
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED_INPUT]');
  }

  // 4. Collapse consecutive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // 5. Enforce safe length truncation
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength) + '... [truncated]';
  }

  return sanitized;
}

/**
 * Sanitizes place names to prevent query injection and malformed tokens.
 */
export function sanitizePlaceName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/[<>'"`;(){}[\]\\]/g, '') // remove SQL/shell/code punctuation
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}
