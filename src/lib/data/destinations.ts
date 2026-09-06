import rawDestinations from '@/data/destinations.json';
import { Destination } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const fallbackDestinations: Destination[] = rawDestinations as Destination[];

export async function getDestinations(city?: string): Promise<Destination[]> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase.from('destinations').select('*');
      if (city) {
        query = query.ilike('city', `%${city}%`);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Destination[];
      }
    }
  } catch (err) {
    console.warn('Supabase fetch failed for destinations, using fallback dataset:', err);
  }

  if (city) {
    const lower = city.toLowerCase();
    const filtered = fallbackDestinations.filter(
      (d) => d.city.toLowerCase().includes(lower) || d.name.toLowerCase().includes(lower)
    );
    return filtered.length > 0 ? filtered : fallbackDestinations;
  }

  return fallbackDestinations;
}

export async function getDestinationById(id: string): Promise<Destination | null> {
  const all = await getDestinations();
  return all.find((d) => d.id === id) || null;
}
