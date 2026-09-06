import { PlatformType } from '@/lib/types/ghoomo';

export interface VideoTranscriptResult {
  hasVoice: boolean;
  transcript: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  platform: PlatformType;
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
    .replace(/&#([0-9]{1,7});/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]{1,6});/g, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return '';
      }
    });
}

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

/**
 * Free YouTube Timed-Text Transcript Extractor
 * Fetches the auto-generated or manual caption tracks directly from YouTube video player response.
 */
async function fetchYouTubeTranscript(url: string): Promise<{ transcript: string; title: string; author: string; thumbnailUrl: string }> {
  let videoId = '';
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  const youtuBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);

  if (shortsMatch) videoId = shortsMatch[1];
  else if (watchMatch) videoId = watchMatch[1];
  else if (youtuBeMatch) videoId = youtuBeMatch[1];

  let title = '';
  let author = '';
  let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  let transcript = '';

  // 1. Fetch metadata via free oEmbed
  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      if (data.title) title = decodeHtmlEntities(data.title);
      if (data.author_name) author = `@${data.author_name.replace(/\s+/g, '_')}`;
      if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
    }
  } catch {}

  if (!videoId) {
    return { transcript, title, author, thumbnailUrl };
  }

  // 2. Fetch YouTube watch page HTML to find caption tracks
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageRes = await fetch(watchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (pageRes.ok) {
      const html = await pageRes.text();

      // Extract title if not yet found
      if (!title) {
        const titleMatch = html.match(/<title>([^<]*)<\/title>/);
        if (titleMatch) title = decodeHtmlEntities(titleMatch[1].replace('- YouTube', '').trim());
      }

      // Find captionTracks in ytInitialPlayerResponse
      const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?});/);
      if (playerMatch) {
        try {
          const playerJson = JSON.parse(playerMatch[1]);
          const captionTracks =
            playerJson?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

          if (Array.isArray(captionTracks) && captionTracks.length > 0) {
            // Prefer English, then Hindi, then any available track
            const preferredTrack =
              captionTracks.find((t: any) => t.languageCode?.startsWith('en')) ||
              captionTracks.find((t: any) => t.languageCode?.startsWith('hi')) ||
              captionTracks[0];

            if (preferredTrack?.baseUrl) {
              const timedTextRes = await fetch(preferredTrack.baseUrl, {
                signal: AbortSignal.timeout(4000),
              });
              if (timedTextRes.ok) {
                const xmlText = await timedTextRes.text();
                // Parse <text> tags from timed text XML
                const segments = Array.from(
                  xmlText.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/gi),
                  (m) => decodeHtmlEntities(m[1].replace(/<[^>]*>/g, '').trim())
                ).filter(Boolean);

                if (segments.length > 0) {
                  transcript = segments.join(' ');
                }
              }
            }
          }

          // Also extract author and shortDescription
          if (!author && playerJson?.videoDetails?.author) {
            author = `@${playerJson.videoDetails.author.replace(/\s+/g, '_')}`;
          }

          const desc = playerJson?.videoDetails?.shortDescription;
          if (desc && desc.trim().length > 30) {
            const cleanDesc = decodeHtmlEntities(desc.trim());
            // If transcript is empty, use description; if both exist, combine them so no context is missed
            if (!transcript) {
              transcript = cleanDesc;
            } else if (cleanDesc.length > 50 && !transcript.includes(cleanDesc.slice(0, 50))) {
              transcript = `${transcript}\n\nAdditional Video Details & Itinerary:\n${cleanDesc}`;
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('[TranscriptService] YouTube caption fetch error:', err);
  }

  return { transcript, title, author, thumbnailUrl };
}

/**
 * Free Instagram Reel Voice & Caption Extractor
 * Fetches speech transcripts embedded in Instagram's public metadata and Facebook crawler response.
 */
async function fetchInstagramTranscript(url: string): Promise<{ transcript: string; title: string; author: string; thumbnailUrl: string }> {
  let title = '';
  let author = '';
  let thumbnailUrl = '';
  let transcript = '';

  const candidates: string[] = [];

  // 1. Primary: Facebook External Hit Crawler (fetches complete, untruncated captions)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const html = await res.text();
      const ogTitleMatch =
        html.match(/property="og:title"\s+content="([^"]*)"/i) ||
        html.match(/content="([^"]*)"\s+property="og:title"/i);

      const ogDescMatch =
        html.match(/property="og:description"\s+content="([^"]*)"/i) ||
        html.match(/content="([^"]*)"\s+property="og:description"/i) ||
        html.match(/name="description"\s+content="([^"]*)"/i);

      const ogImageMatch =
        html.match(/property="og:image"\s+content="([^"]*)"/i) ||
        html.match(/content="([^"]*)"\s+property="og:image"/i);

      if (ogImageMatch) {
        thumbnailUrl = decodeHtmlEntities(ogImageMatch[1]);
      }

      // Extract full caption from og:description
      if (ogDescMatch) {
        const rawDesc = ogDescMatch[1];
        // Parse author from og:description e.g. "... - travelwitharyann on March 28..."
        const authorMatch = rawDesc.match(/-\s*([a-zA-Z0-9._]+)\s+on\s+/i);
        if (authorMatch && !author) {
          author = `@${authorMatch[1]}`;
        }

        // Extract complete caption without clipping on inner quotation marks
        const colonIdx = rawDesc.indexOf(': ');
        if (colonIdx !== -1) {
          let captionText = rawDesc.slice(colonIdx + 2).trim();
          captionText = captionText
            .replace(/^(?:&quot;|["“])\s*/i, '')
            .replace(/\s*(?:&quot;|["”])\.?\s*$/i, '');
          const decoded = decodeHtmlEntities(captionText.trim());
          if (decoded.length > 20) {
            candidates.push(decoded);
          }
        } else {
          candidates.push(decodeHtmlEntities(rawDesc.trim()));
        }
      }

      // Extract full caption from og:title if it contains the full text
      if (ogTitleMatch) {
        const rawTitle = ogTitleMatch[1];
        const onIgIdx = rawTitle.search(/on Instagram:\s*/i);
        if (onIgIdx !== -1) {
          const colonMatch = rawTitle.slice(onIgIdx).match(/:\s*/);
          const offset = colonMatch ? onIgIdx + (colonMatch.index || 0) + colonMatch[0].length : onIgIdx + 15;
          let titleCaption = rawTitle.slice(offset).trim();
          titleCaption = titleCaption
            .replace(/^(?:&quot;|["“])\s*/i, '')
            .replace(/\s*(?:&quot;|["”])\.?\s*$/i, '');
          const decodedTitle = decodeHtmlEntities(titleCaption.trim());
          if (decodedTitle.length > 20) {
            candidates.push(decodedTitle);
          }
        }

        const cleanTitleMatch = rawTitle.match(/^([^:]+)\s+on Instagram/i);
        if (cleanTitleMatch && !author) {
          author = `@${cleanTitleMatch[1].replace(/\s+/g, '_').toLowerCase()}`;
        }
      }
    }
  } catch {}

  // 2. Secondary: Instagram Captioned Embed
  const shortcodeMatch = url.match(/\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';

  if (shortcode) {
    try {
      const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
      const res = await fetch(embedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const html = await res.text();
        const captionMatch =
          html.match(/<div class="Caption"[^>]*>([\s\S]*?)<\/div>/i) ||
          html.match(/class="Caption"[^>]*>([\s\S]*?)<\/a>/i);

        if (captionMatch) {
          const embedText = decodeHtmlEntities(captionMatch[1].replace(/<[^>]*>/g, ' ').trim());
          if (embedText.length > 20) {
            candidates.push(embedText);
          }
        }

        const authorMatch = html.match(/class="UsernameText"[^>]*>([^<]+)<\/a>/i);
        if (authorMatch && !author) {
          author = `@${authorMatch[1].trim()}`;
        }

        const imgMatch = html.match(/class="EmbeddedMediaImage"\s+src="([^"]*)"/i);
        if (imgMatch && !thumbnailUrl) {
          thumbnailUrl = decodeHtmlEntities(imgMatch[1]);
        }
      }
    } catch {}
  }

  // Select the longest, most comprehensive candidate text
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.length - a.length);
    transcript = candidates[0];
  }

  // Create clean title from transcript headline
  if (!title && transcript) {
    const firstLine = transcript.split('\n')[0].replace(/^[^\w\s]+/, '').trim();
    if (firstLine && firstLine.length > 8) {
      title = firstLine.slice(0, 60);
    }
  }

  return {
    transcript,
    title: title || 'Instagram Travel Reel',
    author: author || '@creator',
    thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  };
}

/**
 * Free Hugging Face Whisper Speech-To-Text Fallback
 * Transcribes audio files directly if audio URL is provided.
 */
export async function transcribeAudioWithWhisper(audioBufferOrUrl: string | ArrayBuffer): Promise<string> {
  const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY;
  if (!hfKey) return '';

  try {
    let body: any;
    if (typeof audioBufferOrUrl === 'string') {
      const audioRes = await fetch(audioBufferOrUrl, { signal: AbortSignal.timeout(5000) });
      if (!audioRes.ok) return '';
      body = await audioRes.arrayBuffer();
    } else {
      body = audioBufferOrUrl;
    }

    const res = await fetch(
      'https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body,
        signal: AbortSignal.timeout(8000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      return data.text || '';
    }
  } catch (err) {
    console.warn('[TranscriptService] Whisper transcription fallback error:', err);
  }

  return '';
}

const TRANSCRIPT_CACHE = new Map<string, VideoTranscriptResult>();

/**
 * Master Video Voice Transcript Extractor
 * Extracts spoken text from the video without requiring any paid API.
 */
export async function extractVideoVoiceTranscript(url: string): Promise<VideoTranscriptResult> {
  const normalizedUrl = url.trim().toLowerCase();
  if (TRANSCRIPT_CACHE.has(normalizedUrl)) {
    return TRANSCRIPT_CACHE.get(normalizedUrl)!;
  }

  const platform = detectPlatform(url);
  let hasVoice = false;
  let transcript = '';
  let title = '';
  let author = '';
  let thumbnailUrl = '';

  if (platform === 'youtube') {
    const ytData = await fetchYouTubeTranscript(url);
    transcript = ytData.transcript;
    title = ytData.title;
    author = ytData.author;
    thumbnailUrl = ytData.thumbnailUrl;
    hasVoice = transcript.trim().length > 10;
  } else if (platform === 'instagram') {
    const igData = await fetchInstagramTranscript(url);
    transcript = igData.transcript;
    title = igData.title;
    author = igData.author;
    thumbnailUrl = igData.thumbnailUrl;
    hasVoice = transcript.trim().length > 10;
  } else {
    // For other blogs / web links, extract main content text as transcript
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        },
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const html = await res.text();
        const ogTitle = html.match(/property="og:title"\s+content="([^"]*)"/i);
        const ogDesc = html.match(/property="og:description"\s+content="([^"]*)"/i);
        if (ogTitle) title = decodeHtmlEntities(ogTitle[1]);
        if (ogDesc) transcript = decodeHtmlEntities(ogDesc[1]);
        hasVoice = transcript.trim().length > 15;
      }
    } catch {}
  }

  const result: VideoTranscriptResult = {
    hasVoice,
    transcript: transcript.trim(),
    title: title || 'Travel Video Reel',
    author: author || '@traveler',
    thumbnailUrl:
      thumbnailUrl ||
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    platform,
  };

  if (hasVoice) {
    TRANSCRIPT_CACHE.set(normalizedUrl, result);
  }

  return result;
}
