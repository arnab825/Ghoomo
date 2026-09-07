'use server';

/**
 * Ghoomo Resource Intelligence Server Actions
 * Retrieval, ranking, and validation of authoritative learning resources.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCuratedResourcesForConcept } from '@/lib/learning/resourceCatalog';
import { discoverTopicResources, searchDuckDuckGo } from '@/lib/learning/resourceDiscovery';
import { ResourceCategory } from '@/lib/learning/resourceRanker';

import { GetTopicResourcesInputSchema, GetTopicResourcesInput } from '@/schemas/inputSchemas';
import { formatSafeUserError } from '@/lib/utils/errorHandler';

export interface ResourceItem {
  id: string;
  conceptId: string;
  url: string;
  title: string;
  resourceType: 'docs' | 'article' | 'video' | 'book' | 'practice' | 'interactive';
  category?: ResourceCategory;
  platform: string;
  qualityScore: number;
  durationMinutes?: number;
  validated: boolean;
}

/**
 * Fetch authoritative learning resources for a topic.
 * Checks resource_items table first, triggers live discovery if needed,
 * and falls back to curated catalog if offline.
 */
export async function getTopicResourcesAction(
  rawParams: GetTopicResourcesInput
): Promise<{ success: boolean; resources: ResourceItem[]; error?: string }> {
  // 1. Strict schema validation
  const parseResult = GetTopicResourcesInputSchema.safeParse(rawParams);
  if (!parseResult.success) {
    return {
      success: false,
      resources: [],
      error: parseResult.error.errors[0]?.message || 'Invalid resource request parameters.',
    };
  }
  const params = parseResult.data;

  const supabase = await createServerSupabaseClient();

  try {
    // 1. Check DB resource_items table
    const { data: dbItems, error: dbErr } = await supabase
      .from('resource_items')
      .select('*')
      .eq('concept_id', params.conceptId)
      .order('quality_score', { ascending: false });

    if (!dbErr && dbItems && dbItems.length > 0) {
      return {
        success: true,
        resources: dbItems.map((item: any) => ({
          id: item.id,
          conceptId: item.concept_id,
          url: item.url,
          title: item.title,
          resourceType: item.resource_type,
          platform: item.platform,
          qualityScore: Number(item.quality_score) || 0.8,
          durationMinutes: item.duration_minutes,
          validated: Boolean(item.validated),
        })),
      };
    }

    // 2. Discover live resources via DuckDuckGo and verified catalog
    const catalog = getCuratedResourcesForConcept(params.conceptName, params.domain || 'Computer Science');
    const staticFallbacks = catalog?.resources || [];

    const discovered = await discoverTopicResources({
      topicName: params.conceptName,
      domain: params.domain || 'Computer Science',
      staticCatalogFallbacks: staticFallbacks,
    });

    const finalResources: ResourceItem[] = discovered.map((r, i) => ({
      id: `res-${params.conceptId}-${i}`,
      conceptId: params.conceptId,
      url: r.url,
      title: r.title,
      resourceType: (r.type === 'video' ? 'video' : r.type === 'docs' ? 'docs' : 'article') as any,
      category: r.category,
      platform: r.platform,
      qualityScore: r.overallScore || 0.85,
      durationMinutes: r.durationMinutes,
      validated: true,
    }));

    return {
      success: true,
      resources: finalResources,
    };
  } catch (err: unknown) {
    console.error('getTopicResourcesAction error:', err);
    return {
      success: false,
      resources: [],
      error: formatSafeUserError(err, 'Failed to load topic resources. Please try again.'),
    };
  }
}

export interface DuckDuckGoResourceResult {
  title: string;
  url: string;
  domain: string;
  type: 'docs' | 'article' | 'video' | 'practice';
  snippet?: string;
}

/**
 * Searches DuckDuckGo for live educational materials on demand.
 */
export async function searchDuckDuckGoResourcesAction(
  query: string
): Promise<{ success: boolean; results: DuckDuckGoResourceResult[]; error?: string }> {
  if (!query || query.trim().length < 2) {
    return { success: false, results: [], error: 'Query is too short' };
  }

  try {
    const raw = await searchDuckDuckGo(query.trim(), 6000);
    const results: DuckDuckGoResourceResult[] = raw.map((item) => {
      let type: 'docs' | 'article' | 'video' | 'practice' = 'article';
      const u = item.url.toLowerCase();
      if (u.includes('youtube.com') || u.includes('youtu.be')) {
        type = 'video';
      } else if (u.includes('docs.') || u.includes('/doc') || u.includes('python.org/3/tutorial')) {
        type = 'docs';
      } else if (u.includes('leetcode') || u.includes('practice') || u.includes('hackerrank')) {
        type = 'practice';
      }
      return {
        title: item.title,
        url: item.url,
        domain: new URL(item.url).hostname.replace(/^www\./, ''),
        type,
        snippet: item.snippet,
      };
    });

    return { success: true, results };
  } catch (err) {
    console.error('searchDuckDuckGoResourcesAction error:', err);
    return { success: false, results: [], error: 'Failed to search DuckDuckGo' };
  }
}
