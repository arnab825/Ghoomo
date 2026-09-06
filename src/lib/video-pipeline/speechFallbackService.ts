// ============================================================================
// Speech Fallback Service
// Specification Section 34:
// "Keep the existing transcript system, but move it to fallback status.
// Only call it when:
// Gemini speech confidence is low AND speech appears important,
// or if native video processing fails."
// ============================================================================

import { extractVideoVoiceTranscript, VideoTranscriptResult } from '@/features/social-import/transcriptService';

export class SpeechFallbackService {
  /**
   * Evaluates if speech fallback is warranted
   */
  public static shouldRunFallback(
    speechRelevance: number,
    travelConfidence: number,
    placesCount: number
  ): boolean {
    // If native video understanding found high travel confidence and multiple places, do NOT waste time on fallback
    if (travelConfidence >= 0.8 && placesCount >= 3) {
      return false;
    }

    // Only run if travel confidence is borderline or place extraction was sparse and speech might have extra clues
    return speechRelevance > 0.4 || placesCount < 2;
  }

  /**
   * Invokes speech transcription only as fallback
   */
  public static async executeFallbackTranscription(url: string): Promise<VideoTranscriptResult | null> {
    try {
      const result = await extractVideoVoiceTranscript(url);
      if (result && result.hasVoice && result.transcript.length > 20) {
        return result;
      }
    } catch (err) {
      console.warn('[SpeechFallbackService] Fallback speech transcript skipped:', err);
    }
    return null;
  }
}
