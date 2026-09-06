/**
 * Ghoomo URL Validation Guardrail
 * Validates travel inspiration URLs on both client and server.
 * Allowed formats:
 * 1. Instagram Reels & Posts: instagram.com/reel/..., instagr.am/reel/..., instagram.com/p/...
 * 2. YouTube Shorts & Videos: youtube.com/shorts/..., youtu.be/..., youtube.com/watch?...
 * 3. Travel Blogs: Whitelisted travel domains or verified HTTP/HTTPS blogs
 */

export type PlatformType = 'instagram' | 'youtube' | 'blog';

export interface ValidationResult {
  isValid: boolean;
  platform?: PlatformType;
  normalizedUrl?: string;
  error?: string;
}

// Trusted travel blog domain prefixes / subdomains
const KNOWN_TRAVEL_DOMAINS = [
  'tripoto.com',
  'lonelyplanet.com',
  'travelandleisureasia.com',
  'cntraveller.in',
  'cntraveler.com',
  'holidify.com',
  'nomadicmatt.com',
  'theculturetrip.com',
  'thrillophilia.com',
  'makemytrip.com',
  'natgeotraveller.in',
  'medium.com',
  'substack.com',
  'wordpress.com',
  'blogspot.com',
  'traveltriangle.com',
];

export function validateTravelUrl(inputUrl: string): ValidationResult {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { isValid: false, error: 'Please enter a valid URL' };
  }

  const trimmed = inputUrl.trim();

  // Reject unsafe URI schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('vbscript:')
  ) {
    return { isValid: false, error: 'Unsafe URL scheme detected. Only HTTP/HTTPS is allowed.' };
  }

  // Parse URL
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Malformed URL. Please include https://' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Only HTTP and HTTPS links are supported.' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const pathname = parsed.pathname.toLowerCase();

  // 1. Instagram Reels & Posts
  if (hostname === 'instagram.com' || hostname === 'instagr.am') {
    const isReel = pathname.startsWith('/reel/') || pathname.startsWith('/reels/');
    const isPost = pathname.startsWith('/p/');

    if (isReel || isPost) {
      return {
        isValid: true,
        platform: 'instagram',
        normalizedUrl: parsed.href,
      };
    }
    return {
      isValid: false,
      error: 'Please provide a link to a specific Instagram Reel or Post (e.g. instagram.com/reel/...)',
    };
  }

  // 2. YouTube Shorts & Videos
  if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
    const isShorts = pathname.startsWith('/shorts/');
    const isWatch = pathname === '/watch' && parsed.searchParams.has('v');

    if (isShorts || isWatch) {
      return {
        isValid: true,
        platform: 'youtube',
        normalizedUrl: parsed.href,
      };
    }
    return {
      isValid: false,
      error: 'Please provide a link to a YouTube Short or video (e.g. youtube.com/shorts/...)',
    };
  }

  if (hostname === 'youtu.be') {
    if (pathname.length > 1) {
      return {
        isValid: true,
        platform: 'youtube',
        normalizedUrl: parsed.href,
      };
    }
    return {
      isValid: false,
      error: 'Invalid YouTube shortlink (missing video ID)',
    };
  }

  // 3. Travel Blogs
  const isKnownTravel = KNOWN_TRAVEL_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );

  // Accept known travel platforms or any valid article path with reasonable slug length
  if (isKnownTravel || pathname.length >= 4) {
    return {
      isValid: true,
      platform: 'blog',
      normalizedUrl: parsed.href,
    };
  }

  return {
    isValid: false,
    error: 'Unsupported link. Please paste an Instagram Reel, YouTube Short, or travel blog article.',
  };
}
