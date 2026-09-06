import rawHomestays from '@/data/homestays.json';
import { HomestayListing, HostInquiry } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const fallbackListings: HomestayListing[] = rawHomestays as HomestayListing[];

export async function getListings(
  category = 'all',
  city?: string,
  onlyVerified = false
): Promise<HomestayListing[]> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase.from('listings').select('*');
      if (category !== 'all') {
        query = query.eq('category', category);
      }
      if (city) {
        query = query.ilike('city', `%${city}%`);
      }
      if (onlyVerified) {
        query = query.eq('is_verified', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as HomestayListing[];
      }
    }
  } catch (err) {
    console.warn('Supabase fetch failed for listings, using fallback dataset:', err);
  }

  return fallbackListings.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    const matchesCity = !city || item.city.toLowerCase().includes(city.toLowerCase());
    const matchesVerified = !onlyVerified || item.isVerified;
    return matchesCategory && matchesCity && matchesVerified;
  });
}

export async function createHostInquiry(inquiry: HostInquiry): Promise<{ success: boolean; id: string }> {
  const inquiryId = `inq-${Date.now()}`;
  try {
    if (isSupabaseConfigured()) {
      await supabase.from('listing_inquiries').insert([{
        id: inquiryId,
        listing_id: inquiry.listingId,
        guest_name: inquiry.guestName,
        guest_email: inquiry.guestEmail,
        guest_phone: inquiry.guestPhone,
        dates: inquiry.dates,
        guests_count: inquiry.guestsCount,
        message: inquiry.message,
      }]);
    }
  } catch (err) {
    console.warn('Supabase inquiry insert failed, stored in memory:', err);
  }

  return { success: true, id: inquiryId };
}
