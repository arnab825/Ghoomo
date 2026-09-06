/**
 * Ghoomo Server State Data Service
 * Centralized repository for all trip server state.
 * Consumed by TanStack Query hooks (with caching and query invalidation).
 */

import {
  GhoomoTrip,
  Place,
  TripSource,
  ItineraryDay,
  ItineraryItem,
  BudgetItem,
  ChecklistItem,
  CollabRole,
  TimeSlot,
} from '@/lib/types/ghoomo';
import { extractLocationsFromSocialUrl } from '@/features/social-import/extractors';
import { extractLocationsFromUrlAction } from '@/app/actions/aiActions';
import { generateProximityItinerary } from '@/features/itinerary/clustering';

const STORAGE_KEY = 'ghoomo_trips_data_v2';

// ----------------------------------------------------------------------------
// Initial Trips: 100% Dynamic - Clean Slate (No mock data)
// ----------------------------------------------------------------------------
export function getInitialSeedTrips(): GhoomoTrip[] {
  return [];
}

// ----------------------------------------------------------------------------
// Local Storage / Supabase Persistence Helpers
// ----------------------------------------------------------------------------
function loadLocalTrips(): GhoomoTrip[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let trips: GhoomoTrip[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        trips = parsed;
      }
    }

    // Check and import from legacy Zustand persist store 'ghoomo-trips-storage'
    try {
      const legacyRaw = localStorage.getItem('ghoomo-trips-storage');
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        const legacyTrips = legacyParsed?.state?.trips;
        if (Array.isArray(legacyTrips)) {
          for (const lt of legacyTrips) {
            if (!trips.some((t) => t.id === lt.id)) {
              trips.push(lt);
            }
          }
        }
      }
    } catch {
      // Ignore legacy parse errors
    }

    // Ensure all trips with places have populated day items via proximity clustering
    let modified = false;
    for (const trip of trips) {
      if (
        trip.places &&
        trip.places.length > 0 &&
        (!trip.days || trip.days.length === 0 || trip.days.every((d) => !d.items || d.items.length === 0))
      ) {
        const { days, updatedPlaces } = generateProximityItinerary(
          trip.places,
          trip.durationDays || 3,
          trip.id
        );
        trip.days = days;
        if (updatedPlaces.length > 0) {
          trip.places = updatedPlaces;
        }
        modified = true;
      }
    }

    if (modified) {
      saveLocalTrips(trips);
    }

    return trips;
  } catch {
    return [];
  }
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
function syncToServerDebounced(trips: GhoomoTrip[]): void {
  if (typeof window === 'undefined' || !trips.length) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trips }),
      });
    } catch {
      // Offline fallback
    }
  }, 200);
}

function saveLocalTrips(trips: GhoomoTrip[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    try {
      localStorage.setItem(
        'ghoomo-trips-storage',
        JSON.stringify({ state: { trips, activeTripId: trips[0]?.id || null }, version: 0 })
      );
    } catch {}
    // Automatically sync to server store so shared links and invited collaborators can access it from any browser
    syncToServerDebounced(trips);
  } catch (err) {
    console.error('[TripService] Failed to save trips to local store:', err);
  }
}

// ----------------------------------------------------------------------------
// Server Data Service Operations
// ----------------------------------------------------------------------------
export const tripService = {
  async getAllTrips(): Promise<GhoomoTrip[]> {
    const localTrips = loadLocalTrips();

    if (typeof window !== 'undefined') {
      try {
        if (localTrips.length > 0) {
          syncToServerDebounced(localTrips);
        }

        const res = await fetch('/api/trips', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const serverTrips: GhoomoTrip[] = json.data;
            const merged = [...localTrips];
            for (const st of serverTrips) {
              const existingIdx = merged.findIndex((t) => t.id === st.id);
              if (existingIdx >= 0) {
                if (new Date(st.updatedAt || 0) > new Date(merged[existingIdx].updatedAt || 0)) {
                  merged[existingIdx] = st;
                }
              } else {
                merged.push(st);
              }
            }
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          }
        }
      } catch {
        // Fallback to localTrips if server unreachable
      }
    }

    return localTrips;
  },

  async getTripById(id: string): Promise<GhoomoTrip | null> {
    const localTrips = loadLocalTrips();
    const localTrip = localTrips.find((t) => t.id === id);
    if (localTrip) {
      // Sync local trip to server so other users opening the share link will find it
      syncToServerDebounced(localTrips);
      return localTrip;
    }

    // If not found in local storage (e.g. shared link opened in another browser, incognito, or by a friend)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/trips/${encodeURIComponent(id)}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const serverTrip: GhoomoTrip = json.data;
            // Cache in local storage for this session
            const current = loadLocalTrips();
            if (!current.some((t) => t.id === serverTrip.id)) {
              current.unshift(serverTrip);
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
              } catch {}
            }
            return serverTrip;
          }
        }
      } catch (err) {
        console.warn('[TripService] Could not reach server for shared trip:', err);
      }
    }

    return null;
  },

  async createTrip(data: {
    title: string;
    destinationRegion: string;
    startDate?: string;
    durationDays: number;
    budgetTotal: number;
    travelStyle: 'solo' | 'couple' | 'friends' | 'family';
    initialSocialUrl?: string;
  }): Promise<GhoomoTrip> {
    const tripId = `trip-${Date.now()}`;
    const trips = loadLocalTrips();

    const newTrip: GhoomoTrip = {
      id: tripId,
      title: data.title,
      destinationRegion: data.destinationRegion,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      durationDays: data.durationDays,
      coverImage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
      budgetTotal: data.budgetTotal || 20000,
      travelStyle: data.travelStyle || 'friends',
      status: 'draft',
      collaborators: [
        {
          id: 'user-current',
          name: 'You (Organizer)',
          email: 'traveler@ghoomo.in',
          role: 'editor',
          status: 'accepted',
        },
      ],
      sources: [],
      places: [],
      days: Array.from({ length: data.durationDays }).map((_, i) => ({
        id: `day-${i + 1}-${tripId}`,
        tripId,
        dayNumber: i + 1,
        theme: `Day ${i + 1}: ${data.destinationRegion} Exploration`,
        items: [],
      })),
      budgetItems: [],
      checklistItems: [
        { id: `c-init-1-${tripId}`, tripId, title: 'Confirm accommodations and transit', category: 'booking', isCompleted: false },
        { id: `c-init-2-${tripId}`, tripId, title: 'Pack clothes according to local climate', category: 'packing', isCompleted: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If initial social URL provided, extract and append
    if (data.initialSocialUrl && data.initialSocialUrl.trim() !== '') {
      const res = await extractLocationsFromUrlAction({ url: data.initialSocialUrl.trim(), tripId });
      if (!res.success || !res.data || !res.data.places || res.data.places.length === 0) {
        throw new Error(res.error || 'Location cannot be detected from this video transcript.');
      }

      const extracted = res.data;
      const sourceId = `src-${Date.now()}`;
      const source: TripSource = {
        id: sourceId,
        tripId,
        ...extracted.source,
        createdAt: new Date().toISOString(),
      };

      const duration = extracted.durationDays && extracted.durationDays > 0 ? extracted.durationDays : data.durationDays;
      const budget = extracted.budgetTotal && extracted.budgetTotal > 0 ? extracted.budgetTotal : data.budgetTotal;

      newTrip.durationDays = duration;
      newTrip.budgetTotal = budget;

      if (extracted.destination) {
        newTrip.destinationRegion = extracted.destination;
      }

      if (extracted.checklist && extracted.checklist.length > 0) {
        newTrip.checklistItems = extracted.checklist.map((item, idx) => ({
          id: `c-ai-${Date.now()}-${idx}`,
          tripId,
          title: item,
          category: 'packing',
          isCompleted: false,
        }));
      }

      const places: Place[] = extracted.places.map((p, idx) => ({
        ...p,
        id: `p-${Date.now()}-${idx}`,
        tripId,
        sourceId,
        assignedDay: (idx % duration) + 1,
        timeSlot: (idx % 3 === 0 ? 'morning' : idx % 3 === 1 ? 'afternoon' : 'evening') as TimeSlot,
        createdAt: new Date().toISOString(),
      }));

      newTrip.sources = [source];
      newTrip.places = places;
      if (places[0]?.imageUrl) {
        newTrip.coverImage = places[0].imageUrl;
      }

      if (places[0]?.city && (!newTrip.destinationRegion || newTrip.destinationRegion === 'India Expedition')) {
        newTrip.destinationRegion = places[0].state ? `${places[0].city}, ${places[0].state}` : places[0].city;
      }

      if (extracted.source?.title) {
        newTrip.title = extracted.source.title.slice(0, 50);
      }
      if (extracted.source?.thumbnailUrl) {
        newTrip.coverImage = extracted.source.thumbnailUrl;
      }

      // Auto-cluster places into days so day items are populated immediately
      if (places.length > 0) {
        const { days, updatedPlaces } = generateProximityItinerary(places, duration, tripId);
        newTrip.days = days;
        if (updatedPlaces.length > 0) {
          newTrip.places = updatedPlaces;
        }
      }
    }

    trips.unshift(newTrip);
    saveLocalTrips(trips);
    return newTrip;
  },

  async deleteTrip(tripId: string): Promise<void> {
    const trips = loadLocalTrips().filter((t) => t.id !== tripId);
    saveLocalTrips(trips);
    if (typeof window !== 'undefined') {
      fetch(`/api/trips/${encodeURIComponent(tripId)}`, { method: 'DELETE' }).catch(() => {});
    }
  },

  async updateItinerary(
    tripId: string,
    days: ItineraryDay[],
    updatedPlaces?: Place[]
  ): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];
    trip.days = days;
    if (updatedPlaces) {
      trip.places = updatedPlaces;
    }
    trip.updatedAt = new Date().toISOString();

    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },

  async importSocialUrl(tripId: string, url: string): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];

    // Call server action / extractor
    const response = await extractLocationsFromUrlAction({ url, tripId });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to extract locations from link');
    }

    const { source, places } = response.data;
    const sourceId = `src-${Date.now()}`;
    const newSource: TripSource = {
      ...source,
      id: sourceId,
      tripId,
      createdAt: new Date().toISOString(),
    };

    const newPlaces: Place[] = places.map((p, idx) => ({
      ...p,
      id: `place-${Date.now()}-${idx}`,
      tripId,
      sourceId,
      assignedDay: undefined,
      createdAt: new Date().toISOString(),
    }));

    // If trip currently only has default mock/demo places, replace them with the real imported reel places
    const hasOnlyPlaceholderPlaces =
      trip.places.length <= 2 &&
      trip.places.every(
        (p) =>
          p.city.toLowerCase().includes('jaipur') ||
          p.name.includes('Old City') ||
          p.name.includes('Stepwell') ||
          p.name.includes('Historic')
      );

    if (hasOnlyPlaceholderPlaces) {
      trip.places = newPlaces;
      trip.sources = [newSource];
    } else {
      trip.sources = [newSource, ...trip.sources];
      trip.places = [...newPlaces, ...trip.places];
    }

    if (newPlaces.length > 0) {
      const topPlace = newPlaces[0];
      const detectedRegion = topPlace.state ? `${topPlace.city}, ${topPlace.state}` : topPlace.city;

      if (
        !trip.destinationRegion ||
        trip.destinationRegion === 'India Expedition' ||
        trip.destinationRegion.toLowerCase().includes('jaipur') ||
        hasOnlyPlaceholderPlaces
      ) {
        trip.destinationRegion = detectedRegion;
      }

      if (
        !trip.title ||
        trip.title === 'Trending Travel Experience in India' ||
        trip.title === 'Discovered Social Reel Itinerary' ||
        trip.title === 'Royal Rajasthan Golden Hour Roadtrip' ||
        hasOnlyPlaceholderPlaces
      ) {
        trip.title = newSource.title ? newSource.title.slice(0, 50) : `${detectedRegion} Highlights`;
      }

      if (newSource.thumbnailUrl) {
        trip.coverImage = newSource.thumbnailUrl;
      }
    }

    if (response.data.durationDays && response.data.durationDays > 0) {
      trip.durationDays = response.data.durationDays;
    }
    if (response.data.budgetTotal && response.data.budgetTotal > 0) {
      trip.budgetTotal = response.data.budgetTotal;
    }
    if (response.data.checklist && response.data.checklist.length > 0) {
      const existingTitles = new Set((trip.checklistItems || []).map((c) => c.title.toLowerCase()));
      const newChecklist = response.data.checklist
        .filter((item) => !existingTitles.has(item.toLowerCase()))
        .map((item, idx) => ({
          id: `c-ai-${Date.now()}-${idx}`,
          tripId,
          title: item,
          category: 'packing' as const,
          isCompleted: false,
        }));
      trip.checklistItems = [...(trip.checklistItems || []), ...newChecklist];
    }

    if (trip.places.length > 0) {
      const { days, updatedPlaces } = generateProximityItinerary(
        trip.places,
        trip.durationDays || 3,
        tripId
      );
      trip.days = days;
      if (updatedPlaces.length > 0) {
        trip.places = updatedPlaces;
      }
    }
    trip.updatedAt = new Date().toISOString();

    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },

  async addPlace(
    tripId: string,
    placeData: Omit<Place, 'id' | 'tripId' | 'createdAt'>
  ): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];
    const newPlace: Place = {
      ...placeData,
      id: `place-manual-${Date.now()}`,
      tripId,
      createdAt: new Date().toISOString(),
    };

    trip.places.push(newPlace);

    // If assigned to a day, append to itinerary day items
    if (newPlace.assignedDay) {
      const targetDay = trip.days.find((d) => d.dayNumber === newPlace.assignedDay);
      if (targetDay) {
        targetDay.items.push({
          id: `item-manual-${Date.now()}`,
          dayId: targetDay.id,
          placeId: newPlace.id,
          orderIndex: targetDay.items.length,
          timeSlot: newPlace.timeSlot || 'afternoon',
          durationMinutes: 90,
          place: newPlace,
        });
      }
    }

    trip.updatedAt = new Date().toISOString();
    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },

  async updatePlaceConfidence(
    tripId: string,
    placeId: string,
    confidence: number
  ): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];
    const place = trip.places.find((p) => p.id === placeId);
    if (place) {
      place.confidence = confidence;
    }

    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },

  async deletePlace(tripId: string, placeId: string): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];
    trip.places = trip.places.filter((p) => p.id !== placeId);

    // Clean from days
    trip.days.forEach((day) => {
      day.items = day.items.filter((item) => item.placeId !== placeId);
    });

    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },

  async movePlaceToDay(
    tripId: string,
    placeId: string,
    targetDayNumber: number | undefined,
    timeSlot?: TimeSlot
  ): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];
    const place = trip.places.find((p) => p.id === placeId);
    if (!place) throw new Error('Place not found');

    place.assignedDay = targetDayNumber;
    if (timeSlot) place.timeSlot = timeSlot;

    // Remove from existing day items
    trip.days.forEach((d) => {
      d.items = d.items.filter((item) => item.placeId !== placeId);
    });

    // Add to target day if specified
    if (targetDayNumber) {
      const targetDay = trip.days.find((d) => d.dayNumber === targetDayNumber);
      if (targetDay) {
        targetDay.items.push({
          id: `item-${Date.now()}`,
          dayId: targetDay.id,
          placeId: place.id,
          orderIndex: targetDay.items.length,
          timeSlot: timeSlot || place.timeSlot || 'afternoon',
          durationMinutes: 90,
          place,
        });
      }
    }

    trip.updatedAt = new Date().toISOString();
    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },

  async inviteCollaborator(
    tripId: string,
    email: string,
    role: CollabRole
  ): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];
    const name = email.split('@')[0];
    const newCollab = {
      id: `collab-${Date.now()}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email,
      role,
      status: 'accepted' as const,
    };

    trip.collaborators.push(newCollab);
    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },

  async removeCollaborator(
    tripId: string,
    collaboratorId: string
  ): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];
    trip.collaborators = trip.collaborators.filter((c) => c.id !== collaboratorId);
    trip.updatedAt = new Date().toISOString();
    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },

  async addBudgetItem(
    tripId: string,
    item: Omit<BudgetItem, 'id' | 'tripId'>
  ): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];
    trip.budgetItems.push({
      ...item,
      id: `b-${Date.now()}`,
      tripId,
    });

    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },

  async toggleBudgetItemPaid(tripId: string, itemId: string): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];
    const item = trip.budgetItems.find((b) => b.id === itemId);
    if (item) item.isPaid = !item.isPaid;

    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },

  async deleteBudgetItem(tripId: string, itemId: string): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];
    trip.budgetItems = trip.budgetItems.filter((b) => b.id !== itemId);

    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },

  async addChecklistItem(
    tripId: string,
    item: Omit<ChecklistItem, 'id' | 'tripId' | 'isCompleted'>
  ): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];
    trip.checklistItems.push({
      ...item,
      id: `c-${Date.now()}`,
      tripId,
      isCompleted: false,
    });

    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },

  async toggleChecklistItem(tripId: string, itemId: string): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];
    const item = trip.checklistItems.find((c) => c.id === itemId);
    if (item) item.isCompleted = !item.isCompleted;

    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },

  async deleteChecklistItem(tripId: string, itemId: string): Promise<GhoomoTrip> {
    const trips = loadLocalTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);
    if (tripIndex === -1) throw new Error('Trip not found');

    const trip = trips[tripIndex];
    trip.checklistItems = trip.checklistItems.filter((c) => c.id !== itemId);

    trips[tripIndex] = trip;
    saveLocalTrips(trips);
    return trip;
  },
};
