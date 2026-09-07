/**
 * Ghoomo Resource Validator
 * Validates external URLs discovered from search pipelines or catalog:
 * - Ensures valid URL syntax and secure protocols (HTTPS preferred)
 * - Removes tracking parameters (utm_*, ref, fbclid, etc.)
 * - Validates domain whitelist and reputation
 * - Prevents malicious or low-quality domains
 */

// Trusted, authoritative domains for Computer Science, Engineering, and Programming
const TRUSTED_DOMAINS = [
  'python.org',
  'docs.python.org',
  'developer.mozilla.org',
  'javascript.info',
  'react.dev',
  'nextjs.org',
  'typescriptlang.org',
  'realpython.com',
  'freecodecamp.org',
  'geeksforgeeks.org',
  'mit.edu',
  'ocw.mit.edu',
  'stanford.edu',
  'princeton.edu',
  'berkeley.edu',
  'huggingface.co',
  'pytorch.org',
  'tensorflow.org',
  'scikit-learn.org',
  'youtube.com',
  'youtu.be',
  'github.com',
  'cp-algorithms.com',
  'leetcode.com',
  'neetcode.io',
  'stackoverflow.com',
  'dev.to',
  'refactoring.guru',
  'martinfowler.com',
];

// Blocked or low-signal domains
const BLOCKED_DOMAINS = [
  'pinterest.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'quora.com',
  'medium.com/tag',
];

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'ref_src',
  'fbclid',
  'gclid',
  'source',
];

export interface ValidationResult {
  isValid: boolean;
  sanitizedUrl: string;
  domain: string;
  isTrustedDomain: boolean;
  reason?: string;
}

/**
 * Validates and sanitizes a URL.
 */
export function validateResourceUrl(rawUrl: string): ValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      sanitizedUrl: '',
      domain: '',
      isTrustedDomain: false,
      reason: 'Empty or invalid URL string.',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return {
      isValid: false,
      sanitizedUrl: '',
      domain: '',
      isTrustedDomain: false,
      reason: 'Malformed URL structure.',
    };
  }

  // Must be http or https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      sanitizedUrl: '',
      domain: '',
      isTrustedDomain: false,
      reason: 'Unsupported protocol. Only HTTP/HTTPS allowed.',
    };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

  // Check against blocked domains
  const isBlocked = BLOCKED_DOMAINS.some((b) => hostname === b || hostname.endsWith(`.${b}`));
  if (isBlocked) {
    return {
      isValid: false,
      sanitizedUrl: '',
      domain: hostname,
      isTrustedDomain: false,
      reason: 'Domain is blocked or low educational signal.',
    };
  }

  // Check trusted status
  const isTrustedDomain = TRUSTED_DOMAINS.some(
    (td) => hostname === td || hostname.endsWith(`.${td}`)
  );

  // Strip tracking parameters
  for (const param of TRACKING_PARAMS) {
    parsed.searchParams.delete(param);
  }

  // Upgrade http to https if possible
  if (parsed.protocol === 'http:' && isTrustedDomain) {
    parsed.protocol = 'https:';
  }

  return {
    isValid: true,
    sanitizedUrl: parsed.toString(),
    domain: hostname,
    isTrustedDomain,
  };
}

/**
 * Validates an array of URLs, deduplicating them by domain and path.
 */
export function validateAndDeduplicateUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const valid: string[] = [];

  for (const raw of urls) {
    const res = validateResourceUrl(raw);
    if (!res.isValid) continue;

    // Canonical key (protocol stripped + lowercase path)
    const canonicalKey = res.sanitizedUrl.replace(/^https?:\/\//, '').toLowerCase().replace(/\/$/, '');
    if (!seen.has(canonicalKey)) {
      seen.add(canonicalKey);
      valid.push(res.sanitizedUrl);
    }
  }

  return valid;
}
