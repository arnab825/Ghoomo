/**
 * Ghoomo AI Artifact Cache
 * Persistent DB-backed cache for AI responses to prevent duplicate API calls.
 * Uses deterministic input hashing with prompt versioning.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';

const PROMPT_VERSION = 'v2'; // Increment when prompts change significantly

/**
 * Generates a deterministic hash from normalized input.
 * Uses a simple but effective djb2-variant for speed.
 */
export function hashInput(input: Record<string, unknown>): string {
  const sorted = JSON.stringify(input, Object.keys(input).sort());
  const normalized = sorted.toLowerCase().replace(/\s+/g, ' ').trim();
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(i)) & 0xffffffff;
  }
  return `h_${(hash >>> 0).toString(36)}`;
}

export type ArtifactType =
  | 'roadmap'
  | 'content'
  | 'diagnostic'
  | 'misconception'
  | 'evidence_eval'
  | 'resource_extract'
  | 'challenge'
  | 'rich_content';

/**
 * Looks up a cached AI artifact by type and input hash.
 * Returns the cached response if found and not expired, null otherwise.
 */
export async function getCachedArtifact<T>(
  artifactType: ArtifactType,
  inputHash: string
): Promise<T | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('ai_artifacts')
      .select('response_json, expires_at')
      .eq('artifact_type', artifactType)
      .eq('input_hash', inputHash)
      .eq('prompt_version', PROMPT_VERSION)
      .maybeSingle();

    if (error || !data) return null;

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }

    return data.response_json as T;
  } catch {
    return null;
  }
}

/**
 * Stores an AI response in the persistent cache.
 */
export async function setCachedArtifact(params: {
  artifactType: ArtifactType;
  inputHash: string;
  model: string;
  responseJson: unknown;
  tokenEstimate?: number;
  ttlDays?: number;
}): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (params.ttlDays ?? 30));

    await supabase.from('ai_artifacts').upsert(
      {
        artifact_type: params.artifactType,
        input_hash: params.inputHash,
        prompt_version: PROMPT_VERSION,
        model: params.model,
        response_json: params.responseJson,
        token_estimate: params.tokenEstimate ?? 0,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'artifact_type,input_hash,prompt_version' }
    );
  } catch (err) {
    // Cache write failure is non-fatal — log and continue
    console.warn('[ArtifactCache] Write failed:', err);
  }
}

/**
 * Cache statistics for admin observability.
 */
export async function getCacheStats(): Promise<{
  totalArtifacts: number;
  byType: Record<string, number>;
  oldestAt: string | null;
  expiredCount: number;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('ai_artifacts')
      .select('artifact_type, created_at, expires_at');

    if (error || !data) {
      return { totalArtifacts: 0, byType: {}, oldestAt: null, expiredCount: 0 };
    }

    const byType: Record<string, number> = {};
    let oldestAt: string | null = null;
    let expiredCount = 0;
    const now = new Date();

    for (const row of data) {
      byType[row.artifact_type] = (byType[row.artifact_type] || 0) + 1;
      if (!oldestAt || row.created_at < oldestAt) {
        oldestAt = row.created_at;
      }
      if (row.expires_at && new Date(row.expires_at) < now) {
        expiredCount++;
      }
    }

    return {
      totalArtifacts: data.length,
      byType,
      oldestAt,
      expiredCount,
    };
  } catch {
    return { totalArtifacts: 0, byType: {}, oldestAt: null, expiredCount: 0 };
  }
}
