// ============================================================================
// Gemini Multimodal Video Intelligence Service
// Responsibilities:
// - Gemini Files API integration (resumable upload, active state polling, cleanup)
// - Multimodal travel evidence extraction (Call 1)
// - Structured JSON schema enforcement
// - Exponential backoff retry
// - sha256(video) evidence caching
// ============================================================================

import { TravelEvidence, VideoMetadata } from '../types/travelVideoPipeline';
import { findSampleReel } from './sampleReelsCatalog';

const EVIDENCE_CACHE = new Map<string, TravelEvidence>();

export interface GeminiCallMetrics {
  callsCount: number;
  totalLatencyMs: number;
  model: string;
}

export class GeminiMultimodalService {
  public static getVideoModel(): string {
    return process.env.GEMINI_VIDEO_MODEL || 'gemini-2.5-flash';
  }

  public static getTextModel(): string {
    return process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
  }

  private static getApiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.includes('your-gemini')) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables.');
    }
    return key.trim();
  }

  /**
   * Primary Call 1: Video/Multimodal -> Structured Travel Evidence
   */
  public static async extractTravelEvidence(
    meta: VideoMetadata,
    videoBuffer?: Buffer,
    preScrapedContext?: { title?: string; description?: string; author?: string; rawTranscript?: string }
  ): Promise<{ evidence: TravelEvidence; metrics: GeminiCallMetrics }> {
    const startTime = Date.now();
    let geminiCalls = 0;
    const model = this.getVideoModel();

    // 1. Check sha256 cache
    if (EVIDENCE_CACHE.has(meta.sha256)) {
      return {
        evidence: EVIDENCE_CACHE.get(meta.sha256)!,
        metrics: { callsCount: 0, totalLatencyMs: 0, model: `${model} (cached)` },
      };
    }

    // 2. Check Sample Catalog
    const sample = findSampleReel(meta.source_url) || findSampleReel(meta.sha256);
    if (sample) {
      EVIDENCE_CACHE.set(meta.sha256, sample.mockEvidence);
      return {
        evidence: sample.mockEvidence,
        metrics: { callsCount: 0, totalLatencyMs: 15, model: 'catalog_instant' },
      };
    }

    const apiKey = this.getApiKey();
    let uploadedFileName: string | null = null;
    let fileUri: string | null = null;

    try {
      // 3. Upload to Gemini Files API if raw video buffer exists
      if (videoBuffer && videoBuffer.length > 0) {
        const uploadRes = await this.uploadVideoToFilesApi(videoBuffer, meta.mime_type || 'video/mp4', apiKey);
        if (uploadRes) {
          uploadedFileName = uploadRes.fileName;
          fileUri = uploadRes.fileUri;
          await this.waitForFileActive(uploadedFileName, apiKey);
        }
      }

      // 4. Construct Strict Extraction Prompt (Section 7 & 8 of Spec)
      const currentYear = new Date().getFullYear();
      const prompt = `You are a travel video intelligence engine.

Analyze the supplied video using ALL available signals:
1. Spoken audio / narration
2. Visual scenes and landscapes
3. Recognizable landmarks
4. On-screen signboards and road markers
5. On-screen text, subtitles, and overlays
6. Maps or transit clues
7. Hotel, resort, cafe, and restaurant names
8. Geographical features (mountains, beaches, desert, tropical jungle, European architecture, Indian monuments)
9. Dates, months, and seasons mentioned
10. Explicit trip durations (e.g. "5 days", "3-day trip")
11. Explicit creator recommendations
12. Activities and excursions shown

Video Metadata:
- Source URL: "${meta.source_url}"
- Platform: "${meta.source_platform || 'social'}"
- Scraped Title / Caption: "${preScrapedContext?.title || ''}"
- Scraped Details: "${preScrapedContext?.description || ''}"
- Audio/Transcript Clue: "${preScrapedContext?.rawTranscript?.slice(0, 4000) || 'None'}"
- Current Reference Year: ${currentYear}

CRITICAL RULES:
- Your task is ONLY to extract travel evidence.
- Do NOT generate an itinerary.
- Do NOT invent places or fake coordinates.
- Separate:
  a) Explicit information (what creator explicitly says or shows on screen)
  b) Visual observations (landmarks, streetscapes, geography recognized from footage)
  c) Inferred information (derived context)
- Determine whether speech is actually travel-relevant. Motivational speeches ("chase your dreams") or generic voiceovers must receive low speech.travel_relevance (0.0 to 0.20) and visual/OCR cues must take priority!
- Background music without lyrics must receive travel_relevance = 0.0.
- For seasonal recommendation videos (e.g. "Top places in September"), extract candidate destinations without merging them into one trip.
- Relative date expressions like "this year" must be noted in temporal_context.
- Classify into one primary video_type:
  ["ITINERARY", "DESTINATION_GUIDE", "DESTINATION_RECOMMENDATION", "SEASONAL_RECOMMENDATION", "YEARLY_RECOMMENDATION", "TRAVEL_TIPS", "FOOD_TRAVEL", "HOTEL_TRAVEL", "TRAVEL_MONTAGE", "TRAVEL_VLOG", "MOTIVATIONAL_TRAVEL", "MULTI_DESTINATION", "UNKNOWN"]

Respond ONLY with valid JSON matching this schema:
{
  "is_travel_video": true,
  "travel_confidence": 0.95,
  "video_type": "ITINERARY",
  "temporal_context": {
    "month": "September",
    "season": null,
    "year": ${currentYear},
    "relative_expression": null
  },
  "destination_candidates": [
    {
      "name": "Primary Destination",
      "confidence": 0.95,
      "country": "Country",
      "region": "Region",
      "evidence": [
        { "type": "text", "description": "Overlay title shows destination", "timestamp": "00:03", "confidence": 0.98 }
      ]
    }
  ],
  "primary_destination": "City or Region, Country",
  "places": [
    {
      "name": "Place Name",
      "canonicalName": "Canonical Name",
      "type": "temple | beach | landmark | museum | viewpoint | street | food",
      "source": "visual | speech | text | multiple",
      "provenance": "creator_speech | creator_text | creator_visual | creator_multiple",
      "confidence": 0.92,
      "timestamp": "00:15",
      "lat": 0.0,
      "lng": 0.0,
      "city": "City",
      "state": "State",
      "country": "Country",
      "notes": "Short highlight observed from video",
      "estimatedVisitMinutes": 90
    }
  ],
  "activities": [
    { "name": "Activity description", "confidence": 0.9, "source": "visual", "timestamp": "00:20" }
  ],
  "duration": {
    "days": 5,
    "explicit": true,
    "notes": "Explicit duration if stated, otherwise null with explicit: false"
  },
  "creator_recommendations": ["Recommendation 1", "Recommendation 2"],
  "speech": {
    "available": true,
    "travel_relevance": 0.85,
    "summary": "Summary of spoken content relevance"
  },
  "evidence": [
    { "type": "visual", "description": "Landmark seen in video", "timestamp": "00:10", "confidence": 0.95 }
  ]
}`;

      // 5. Send multimodal request to Gemini with retry
      geminiCalls++;
      const contents: any[] = [];
      const parts: any[] = [];

      if (fileUri) {
        parts.push({
          fileData: {
            mimeType: meta.mime_type || 'video/mp4',
            fileUri,
          },
        });
      }
      parts.push({ text: prompt });
      contents.push({ parts });

      const rawJson = await this.callGeminiWithRetry(model, contents, apiKey);
      const parsed: TravelEvidence = JSON.parse(rawJson);

      // Cache successful evidence
      EVIDENCE_CACHE.set(meta.sha256, parsed);

      return {
        evidence: parsed,
        metrics: {
          callsCount: geminiCalls,
          totalLatencyMs: Date.now() - startTime,
          model,
        },
      };
    } finally {
      // 6. Cleanup uploaded file from Files API
      if (uploadedFileName) {
        this.deleteFilesApiFile(uploadedFileName, apiKey).catch(() => {});
      }
    }
  }

  /**
   * Files API: Uploads video buffer
   */
  private static async uploadVideoToFilesApi(
    buffer: Buffer,
    mimeType: string,
    apiKey: string
  ): Promise<{ fileName: string; fileUri: string } | null> {
    try {
      // Step 1: Start resumable upload
      const startUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
      const startRes = await fetch(startUrl, {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': buffer.length.toString(),
          'X-Goog-Upload-Header-Content-Type': mimeType,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: { display_name: `ghoomo_video_${Date.now()}` },
        }),
      });

      if (!startRes.ok) {
        console.warn('[GeminiFilesAPI] Resumable upload start failed:', startRes.statusText);
        return null;
      }

      const uploadUrl = startRes.headers.get('x-goog-upload-url');
      if (!uploadUrl) return null;

      // Step 2: Upload bytes
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Length': buffer.length.toString(),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize',
        },
        body: new Uint8Array(buffer),
      });

      if (uploadRes.ok) {
        const fileInfo = await uploadRes.json();
        return {
          fileName: fileInfo.file?.name,
          fileUri: fileInfo.file?.uri,
        };
      }
    } catch (err) {
      console.warn('[GeminiFilesAPI] Upload exception:', err);
    }
    return null;
  }

  /**
   * Files API: Poll until file state is ACTIVE
   */
  private static async waitForFileActive(fileName: string, apiKey: string, maxWaitMs = 25000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.state === 'ACTIVE') return true;
          if (data.state === 'FAILED') throw new Error('Gemini Files API video processing failed.');
        }
      } catch (err) {
        console.warn('[GeminiFilesAPI] Polling state notice:', err);
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    return true;
  }

  /**
   * Files API: Delete file after inference
   */
  private static async deleteFilesApiFile(fileName: string, apiKey: string): Promise<void> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`;
      await fetch(url, { method: 'DELETE' });
    } catch {}
  }

  /**
   * Calls Gemini with exponential backoff
   */
  public static async callGeminiWithRetry(model: string, contents: any[], apiKey: string): Promise<string> {
    const delays = [1000, 2000, 4000];
    let lastError: any = null;

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            // Strip possible markdown code fences
            return text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
          }
        }

        const errText = await response.text();
        lastError = new Error(`Gemini API error (${response.status}): ${errText}`);
      } catch (err) {
        lastError = err;
      }

      if (attempt < delays.length) {
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      }
    }

    throw lastError || new Error('Gemini API call failed after retries.');
  }
}
