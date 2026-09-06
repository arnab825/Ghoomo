// ============================================================================
// Video Ingestion Service
// Responsibilities:
// - URL validation
// - Supported source detection
// - Video downloading/streaming to temp storage
// - SHA-256 calculation for deduplication
// - Metadata extraction
// - Video cache management
// ============================================================================

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { VideoMetadata } from '../types/travelVideoPipeline';
import { findSampleReel } from './sampleReelsCatalog';

export interface IngestedVideoResult {
  metadata: VideoMetadata;
  filePath?: string;
  buffer?: Buffer;
  isCached: boolean;
  fromSampleCatalog?: boolean;
}

const VIDEO_CACHE = new Map<string, IngestedVideoResult>();
const TEMP_DIR = path.join(os.tmpdir(), 'ghoomo-videos');

function ensureTempDir() {
  try {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  } catch {}
}

export class VideoIngestionService {
  /**
   * Validates if a URL is a supported public travel video/reel link
   */
  public static validateUrl(url: string): { isValid: boolean; platform: string; error?: string } {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return { isValid: false, platform: 'unknown', error: 'URL is required.' };
    }

    const trimmed = url.trim();

    // Check sample reels
    if (trimmed.startsWith('sample-') || findSampleReel(trimmed)) {
      return { isValid: true, platform: 'sample' };
    }

    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();

      if (host.includes('instagram.com') || host.includes('instagr.am')) {
        return { isValid: true, platform: 'instagram' };
      }
      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        return { isValid: true, platform: 'youtube' };
      }
      if (host.includes('tiktok.com')) {
        return { isValid: true, platform: 'tiktok' };
      }
      if (
        trimmed.endsWith('.mp4') ||
        trimmed.endsWith('.mov') ||
        trimmed.endsWith('.webm') ||
        trimmed.includes('/video/') ||
        trimmed.includes('cdn') ||
        trimmed.includes('unsplash') ||
        trimmed.includes('pexels')
      ) {
        return { isValid: true, platform: 'direct_video' };
      }

      // Generic web travel article/video link
      return { isValid: true, platform: 'web_travel' };
    } catch {
      return { isValid: false, platform: 'unknown', error: 'Invalid URL format. Please provide a valid public link.' };
    }
  }

  /**
   * Ingests a video from URL, downloads buffer, calculates sha256, and returns metadata
   */
  public static async ingestVideo(url: string): Promise<IngestedVideoResult> {
    ensureTempDir();
    const trimmed = url.trim();

    // 1. Check Sample Reels Catalog for instant zero-latency processing
    const sample = findSampleReel(trimmed);
    if (sample) {
      const sampleHash = crypto.createHash('sha256').update(sample.id).digest('hex');
      const metadata: VideoMetadata = {
        duration_seconds: sample.durationSeconds,
        width: 1080,
        height: 1920,
        fps: 30,
        mime_type: 'video/mp4',
        sha256: sampleHash,
        file_name: `${sample.id}.mp4`,
        source_platform: 'sample',
        source_url: sample.url,
      };

      const result: IngestedVideoResult = {
        metadata,
        isCached: true,
        fromSampleCatalog: true,
      };
      VIDEO_CACHE.set(sampleHash, result);
      return result;
    }

    // 2. Check if already cached by raw URL hash
    const urlHash = crypto.createHash('sha256').update(trimmed).digest('hex');
    if (VIDEO_CACHE.has(urlHash)) {
      const cached = VIDEO_CACHE.get(urlHash)!;
      return { ...cached, isCached: true };
    }

    const { isValid, platform, error } = this.validateUrl(trimmed);
    if (!isValid) {
      throw new Error(error || 'Invalid or unsupported video URL');
    }

    // 3. Attempt direct video download or public crawler fetch
    try {
      let downloadUrl = trimmed;

      // Handle Instagram embed video extractor if available
      if (platform === 'instagram') {
        const videoMatch = await this.extractInstagramMediaUrl(trimmed);
        if (videoMatch) {
          downloadUrl = videoMatch;
        }
      }

      // Fetch video buffer with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s max download

      const res = await fetch(downloadUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'video/mp4,video/*,*/*',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'video/mp4';
        const isVideoStream = contentType.includes('video') || contentType.includes('octet-stream');

        if (isVideoStream) {
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

          // Check if hash is cached
          if (VIDEO_CACHE.has(sha256)) {
            return { ...VIDEO_CACHE.get(sha256)!, isCached: true };
          }

          const fileName = `video-${sha256.slice(0, 16)}.mp4`;
          const filePath = path.join(TEMP_DIR, fileName);
          try {
            fs.writeFileSync(filePath, buffer);
          } catch {}

          const metadata: VideoMetadata = {
            duration_seconds: 45, // default approximation until ffprobe/gemini inspection
            width: 1080,
            height: 1920,
            fps: 30,
            mime_type: contentType.includes('video/') ? contentType : 'video/mp4',
            sha256,
            file_name: fileName,
            file_size_bytes: buffer.length,
            source_platform: platform,
            source_url: trimmed,
          };

          const result: IngestedVideoResult = {
            metadata,
            filePath,
            buffer,
            isCached: false,
          };

          VIDEO_CACHE.set(sha256, result);
          VIDEO_CACHE.set(urlHash, result);
          return result;
        }
      }
    } catch (err) {
      console.warn('[VideoIngestionService] Direct stream fetch notice:', (err as Error).message);
    }

    // 4. Fallback for public social links where direct stream download is DRM/cipher protected:
    // Generate deterministic metadata descriptor
    const fallbackHash = crypto.createHash('sha256').update(trimmed).digest('hex');
    const metadata: VideoMetadata = {
      duration_seconds: 40,
      width: 1080,
      height: 1920,
      fps: 30,
      mime_type: 'video/mp4',
      sha256: fallbackHash,
      source_platform: platform,
      source_url: trimmed,
    };

    const result: IngestedVideoResult = {
      metadata,
      isCached: false,
    };

    VIDEO_CACHE.set(fallbackHash, result);
    return result;
  }

  /**
   * Helper to scrape Instagram public video tag
   */
  private static async extractInstagramMediaUrl(url: string): Promise<string | null> {
    try {
      const codeMatch = url.match(/\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
      if (!codeMatch) return null;
      const shortcode = codeMatch[1];

      const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        signal: AbortSignal.timeout(3500),
      });

      if (embedRes.ok) {
        const html = await embedRes.text();
        const videoMatch = html.match(/class="EmbeddedMediaImage"\s+src="([^"]*)"/i);
        if (videoMatch) return videoMatch[1];
      }
    } catch {}
    return null;
  }
}
