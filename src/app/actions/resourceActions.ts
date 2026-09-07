'use server';

/**
 * Ghoomo Resource Intelligence Server Actions
 * Retrieval, ranking, and validation of authoritative learning resources.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCuratedResourcesForConcept } from '@/lib/learning/resourceCatalog';

export interface ResourceItem {
  id: string;
  conceptId: string;
  url: string;
  title: string;
  resourceType: 'docs' | 'article' | 'video' | 'book' | 'practice' | 'interactive';
  platform: string;
  qualityScore: number;
  durationMinutes?: number;
  validated: boolean;
}

/**
 * Fetch authoritative learning resources for a topic.
 * Checks resource_items table first; falls back to curated catalog if empty.
 */
export async function getTopicResourcesAction(params: {
  conceptId: string;
  conceptName: string;
  domain?: string;
}): Promise<{ success: boolean; resources: ResourceItem[]; error?: string }> {
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

    // 2. Fallback to catalog
    const catalog = getCuratedResourcesForConcept(params.conceptName, params.domain || 'Computer Science');
    const fallbackResources: ResourceItem[] = (catalog?.resources || []).map((r, i) => ({
      id: `curated-${params.conceptId}-${i}`,
      conceptId: params.conceptId,
      url: r.url,
      title: r.title,
      resourceType: (r.type === 'video' ? 'video' : r.type === 'docs' ? 'docs' : 'article') as any,
      platform: r.platform,
      qualityScore: 0.9,
      durationMinutes: r.durationMinutes,
      validated: true,
    }));

    return {
      success: true,
      resources: fallbackResources,
    };
  } catch (err: any) {
    return {
      success: false,
      resources: [],
      error: err.message || 'Failed to load topic resources',
    };
  }
}
