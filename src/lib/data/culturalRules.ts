import rawCulturalRules from '@/data/cultural-rules.json';
import { CulturalRule } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const fallbackRules: CulturalRule[] = rawCulturalRules as CulturalRule[];

export async function getCulturalRules(stateFilter?: string): Promise<CulturalRule[]> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase.from('cultural_rules').select('*');
      if (stateFilter && stateFilter !== 'All') {
        query = query.ilike('state', `%${stateFilter}%`);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as CulturalRule[];
      }
    }
  } catch (err) {
    console.warn('Supabase fetch failed for cultural rules, using fallback dataset:', err);
  }

  if (stateFilter && stateFilter !== 'All') {
    const lower = stateFilter.toLowerCase();
    return fallbackRules.filter(
      (r) => r.state.toLowerCase().includes(lower) || r.site.toLowerCase().includes(lower)
    );
  }

  return fallbackRules;
}
