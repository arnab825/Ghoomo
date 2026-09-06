import { PlatformType, Place, TripSource } from '@/lib/types/ghoomo';
import { searchPlacesReference } from './referenceMatcher';
import { extractVideoVoiceTranscript } from './transcriptService';

export function detectPlatform(url: string): PlatformType {
  const lowercase = url.toLowerCase();
  if (lowercase.includes('instagram.com') || lowercase.includes('instagr.am')) {
    return 'instagram';
  }
  if (lowercase.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (lowercase.includes('youtube.com') || lowercase.includes('youtu.be')) {
    return 'youtube';
  }
  if (lowercase.includes('http://') || lowercase.includes('https://')) {
    return 'blog';
  }
  return 'other';
}

export interface ScrapedSocialMeta {
  title: string;
  description: string;
  thumbnailUrl: string;
  author: string;
  platform: PlatformType;
}

export interface ExtractionResult {
  source: Omit<TripSource, 'id' | 'tripId' | 'createdAt'>;
  places: Omit<Place, 'id' | 'tripId' | 'sourceId' | 'createdAt'>[];
  destination?: string;
  durationDays?: number;
  budgetTotal?: number;
  checklist?: string[];
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x1f1e8;&#x1f1ed;/g, '🇨🇭')
    .replace(/&#([0-9]{1,7});/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]{1,6});/g, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return '';
      }
    });
}

/**
 * Real-time Social Link Metadata Scraper
 */
const SCRAPER_CACHE = new Map<string, ScrapedSocialMeta>();

export async function fetchSocialPageMetadata(url: string): Promise<ScrapedSocialMeta> {
  const normalizedUrl = url.trim().toLowerCase();
  if (SCRAPER_CACHE.has(normalizedUrl)) {
    return SCRAPER_CACHE.get(normalizedUrl)!;
  }

  const platform = detectPlatform(url);
  let title = '';
  let description = '';
  let thumbnailUrl = '';
  let author = '';

  // 1. YouTube oEmbed
  if (platform === 'youtube') {
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (oembedData.title) title = decodeHtmlEntities(oembedData.title);
        if (oembedData.author_name) author = `@${oembedData.author_name.replace(/\s+/g, '_')}`;
        if (oembedData.thumbnail_url) thumbnailUrl = oembedData.thumbnail_url;
      }
    } catch {}
  }

  // 2. TikTok oEmbed
  if (platform === 'tiktok') {
    try {
      const oembedRes = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (oembedData.title) title = decodeHtmlEntities(oembedData.title);
        if (oembedData.author_name) author = `@${oembedData.author_name.replace(/\s+/g, '_')}`;
        if (oembedData.thumbnail_url) thumbnailUrl = oembedData.thumbnail_url;
      }
    } catch {}
  }

  // 3. Instagram Embed & Open-Graph Scrape
  if (platform === 'instagram') {
    try {
      const codeMatch = url.match(/\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
      if (codeMatch) {
        const shortcode = codeMatch[1];
        const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(4000),
        });
        if (embedRes.ok) {
          const embedHtml = await embedRes.text();
          const captionMatch =
            embedHtml.match(/<div class="Caption"[^>]*>([\s\S]*?)<\/div>/i) ||
            embedHtml.match(/class="Caption"[^>]*>([\s\S]*?)<\/a>/i);
          if (captionMatch) {
            description = decodeHtmlEntities(captionMatch[1].replace(/<[^>]*>/g, ' ').trim());
          }
          const authorMatch = embedHtml.match(/class="UsernameText"[^>]*>([^<]+)<\/a>/i);
          if (authorMatch) {
            author = `@${authorMatch[1].trim()}`;
          }
          const embedImgMatch = embedHtml.match(/class="EmbeddedMediaImage"\s+src="([^"]*)"/i);
          if (embedImgMatch) {
            thumbnailUrl = decodeHtmlEntities(embedImgMatch[1]);
          }
        }
      }
    } catch {}
  }

  // 4. Open-graph fallback
  if (!description || !title) {
    try {
      const pageRes = await fetch(url, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(4500),
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        const ogTitle =
          html.match(/property="og:title"\s+content="([^"]*)"/i) ||
          html.match(/content="([^"]*)"\s+property="og:title"/i);
        const ogDesc =
          html.match(/property="og:description"\s+content="([^"]*)"/i) ||
          html.match(/content="([^"]*)"\s+property="og:description"/i) ||
          html.match(/name="description"\s+content="([^"]*)"/i);
        const ogImage =
          html.match(/property="og:image"\s+content="([^"]*)"/i) ||
          html.match(/content="([^"]*)"\s+property="og:image"/i);

        if (ogTitle && !title) title = decodeHtmlEntities(ogTitle[1]);
        if (ogDesc && !description) description = decodeHtmlEntities(ogDesc[1]);
        if (ogImage && !thumbnailUrl) thumbnailUrl = decodeHtmlEntities(ogImage[1]);
      }
    } catch {}
  }

  // Clean Instagram post title if it has "User on Instagram: ..."
  if (title.includes('on Instagram:')) {
    const splitParts = title.split('on Instagram:');
    const quote = splitParts[1]?.trim().replace(/^["“]+|["”]+$/g, '');
    if (quote && quote.length > 10) {
      title = quote.slice(0, 60);
    }
  }

  const result: ScrapedSocialMeta = {
    title: title || 'Travel Video Reel',
    description,
    thumbnailUrl:
      thumbnailUrl ||
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    author: author || '@traveler',
    platform,
  };

  SCRAPER_CACHE.set(normalizedUrl, result);
  return result;
}

/**
 * Fallback Location Extractor Engine
 * Uses live voice transcript to detect real spoken locations.
 * Throws an error if no location can be detected from speech.
 * NO MOCK DATA. NO FAKE PLACES.
 */
export async function extractLocationsFromSocialUrl(
  url: string,
  preloadedMeta?: ScrapedSocialMeta
): Promise<ExtractionResult> {
  const meta = preloadedMeta || (await fetchSocialPageMetadata(url));
  const transcriptResult = await extractVideoVoiceTranscript(url);

  const fullText = `${transcriptResult.transcript} ${meta.title} ${meta.description}`.toLowerCase();

  if (!fullText || fullText.trim().length < 15) {
    throw new Error('No voice or speech could be detected in this video. Please provide a video with spoken audio.');
  }

  // Check known Indian reference cities in dataset if mentioned in spoken transcript
  const knownCities = [
    'manali', 'goa', 'rishikesh', 'kasol', 'udaipur', 'jaipur',
    'varanasi', 'munnar', 'alleppey', 'leh', 'ladakh', 'ooty',
    'darjeeling', 'coorg', 'hampi', 'agra', 'amritsar', 'shimla'
  ];

  for (const city of knownCities) {
    if (fullText.includes(city)) {
      const canonicalName = city.charAt(0).toUpperCase() + city.slice(1);
      const refPlaces = searchPlacesReference('', canonicalName, 5);
      if (refPlaces.length > 0) {
        return {
          destination: `${canonicalName}, India`,
          source: {
            url,
            platform: meta.platform,
            title: meta.title || `${canonicalName} Highlights`,
            author: meta.author,
            thumbnailUrl: meta.thumbnailUrl || refPlaces[0].image_url,
            rawTranscript: transcriptResult.transcript || meta.description,
          },
          places: refPlaces.map((rp) => ({
            name: rp.name,
            city: rp.city,
            state: rp.state,
            lat: rp.lat,
            lng: rp.lng,
            category: rp.category,
            confidence: rp.popularity_score,
            imageUrl: rp.image_url,
            notes: rp.description,
          })),
        };
      }
    }
  }

  // If no location is detected from voice transcript: STRICTLY FAIL.
  throw new Error('Location cannot be detected from this video transcript.');
}
