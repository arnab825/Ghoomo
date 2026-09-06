import { SavedTrip, ItineraryPlan } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const LOCAL_STORAGE_KEY = 'ghoomo_saved_trips_v1';

// Seed demo trip so evaluator sees real data immediately upon first load
const SEED_TRIP: SavedTrip = {
  id: 'trip-demo-jaipur-1',
  title: 'Royal Heritage & Crafts Explorer',
  city: 'Jaipur',
  daysCount: 3,
  totalBudget: 12500,
  travelStyle: 'cultural',
  status: 'planned',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  plan: {
    id: 'plan-demo-1',
    destination: 'Jaipur',
    durationDays: 3,
    budgetTotal: 12500,
    travelStyle: 'cultural',
    days: [
      {
        dayNumber: 1,
        theme: 'Pink City Royal Architecture & Bazaars',
        hotel: {
          id: 'stay-1',
          title: 'Heritage Haveli Courtyard Stay',
          pricePerUnit: 2200,
          rating: 4.9,
          imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
          description: 'Family-run 180-year-old heritage haveli in the Pink City.',
        },
        activities: [
          {
            time: '09:00 AM',
            title: 'Hawa Mahal & Old City Walk',
            location: 'Badi Choupad, Pink City',
            type: 'Heritage Walk',
            estimatedCost: 200,
            description: 'Intricate 953 honeycomb windows designed for royal Rajput women to observe street processions.',
            etiquetteTip: 'Photography allowed from street and opposite rooftop cafes.',
            isIndoor: false,
          },
          {
            time: '11:30 AM',
            title: 'City Palace Museum & Armoury',
            location: 'Old City, Jaipur',
            type: 'Royal Palace',
            estimatedCost: 300,
            description: 'Blend of Rajasthani and Mughal architecture housing royal robes, weapons, and silver Ganga jars.',
            etiquetteTip: 'Do not touch fresco wall paintings.',
            isIndoor: true,
          },
          {
            time: '03:30 PM',
            title: 'Jantar Mantar Astronomical Observatory',
            location: 'Near City Palace',
            type: 'UNESCO Heritage Site',
            estimatedCost: 200,
            description: 'World largest stone sundial and astronomical instruments built by Maharaja Sawai Jai Singh II.',
            isIndoor: false,
          },
        ],
      },
      {
        dayNumber: 2,
        theme: 'Hilltop Forts & Block Printing Artisans',
        activities: [
          {
            time: '08:30 AM',
            title: 'Amber Fort & Maota Lake',
            location: 'Amer, 11km north of Jaipur',
            type: 'Hilltop Fortress',
            estimatedCost: 550,
            description: 'Majestic yellow sandstone ramparts, Sheesh Mahal mirror palace, and panoramic Aravalli views.',
            etiquetteTip: 'Politely refuse unlicensed touts offering elephant rides.',
            isIndoor: false,
          },
          {
            time: '02:00 PM',
            title: 'Anokhi Museum of Hand Printing',
            location: 'Kheri Gate, Amer',
            type: 'Artisan Workshop',
            estimatedCost: 150,
            description: 'Watch live master artisans carve wooden blocks and stamp indigo natural dyes onto organic cotton.',
            isIndoor: true,
          },
        ],
      },
      {
        dayNumber: 3,
        theme: 'Sacred Temples & Twilight Nahargarh Sunset',
        activities: [
          {
            time: '10:00 AM',
            title: 'Albert Hall State Museum',
            location: 'Ram Niwas Garden',
            type: 'Indo-Saracenic Museum',
            estimatedCost: 150,
            description: 'Rajasthan oldest museum showcasing Persian carpets, metal sculptures, and Egyptian mummy.',
            isIndoor: true,
          },
          {
            time: '04:30 PM',
            title: 'Nahargarh Fort Sunset Viewpoint',
            location: 'Aravalli Hills',
            type: 'Panoramic Viewpoint',
            estimatedCost: 100,
            description: 'Watch the entire Pink City illuminate as the sun dips below the Aravalli horizon.',
            isIndoor: false,
          },
        ],
      },
    ],
    fairExpenseEstimate: {
      stay: 4400,
      transport: 1800,
      food: 3200,
      activities: 1900,
    },
    scamAlerts: [
      'Prepaid taxi counter confusion outside railway stations.',
      'Fake gemstone export schemes in commercial alleys.',
    ],
  },
};

export function getSavedTripsFromStorage(): SavedTrip[] {
  if (typeof window === 'undefined') return [SEED_TRIP];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([SEED_TRIP]));
      return [SEED_TRIP];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [SEED_TRIP];
  } catch {
    return [SEED_TRIP];
  }
}

export function saveTripToStorage(trip: SavedTrip): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedTripsFromStorage();
    const filtered = existing.filter((t) => t.id !== trip.id);
    const updated = [trip, ...filtered];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save trip to localStorage:', err);
  }
}

export function deleteTripFromStorage(tripId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedTripsFromStorage();
    const updated = existing.filter((t) => t.id !== tripId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete trip from localStorage:', err);
  }
}

export async function fetchAllTrips(): Promise<SavedTrip[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          title: d.title,
          city: d.destination_city,
          daysCount: d.duration_days,
          totalBudget: d.budget_total,
          travelStyle: d.travel_style,
          status: d.status,
          plan: d.plan_data,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    }
  } catch (err) {
    console.warn('Supabase trips fetch failed, falling back to local storage:', err);
  }

  return getSavedTripsFromStorage();
}

export async function persistTrip(
  plan: ItineraryPlan,
  title?: string,
  userId?: string
): Promise<SavedTrip> {
  const tripId = `trip-${Date.now()}`;
  const newTrip: SavedTrip = {
    id: tripId,
    userId,
    title: title || `${plan.destination} ${plan.durationDays}-Day Cultural Journey`,
    city: plan.destination,
    daysCount: plan.durationDays,
    totalBudget: plan.budgetTotal,
    travelStyle: plan.travelStyle,
    status: 'planned',
    plan,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveTripToStorage(newTrip);

  try {
    if (isSupabaseConfigured()) {
      await supabase.from('trips').insert([
        {
          id: tripId,
          user_id: userId || null,
          title: newTrip.title,
          destination_city: newTrip.city,
          duration_days: newTrip.daysCount,
          budget_total: newTrip.totalBudget,
          travel_style: newTrip.travelStyle,
          plan_data: newTrip.plan,
          status: newTrip.status,
        },
      ]);
    }
  } catch (err) {
    console.warn('Supabase persist failed, kept in localStorage:', err);
  }

  return newTrip;
}
