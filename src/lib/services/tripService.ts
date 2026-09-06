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
import { SAMPLE_VIRAL_REELS } from '@/features/social-import/sampleReels';
import { extractLocationsFromSocialUrl } from '@/features/social-import/extractors';
import { extractLocationsFromUrlAction } from '@/app/actions/aiActions';

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
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalTrips(trips: GhoomoTrip[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (err) {
    console.error('[TripService] Failed to save trips to local store:', err);
  }
}

// ----------------------------------------------------------------------------
// Server Data Service Operations
// ----------------------------------------------------------------------------
export const tripService = {
  async getAllTrips(): Promise<GhoomoTrip[]> {
    // Simulate slight network latency for realistic caching benefits
    await new Promise((r) => setTimeout(r, 50));
    return loadLocalTrips();
  },

  async getTripById(id: string): Promise<GhoomoTrip | null> {
    await new Promise((r) => setTimeout(r, 50));
    const trips = loadLocalTrips();
    return trips.find((t) => t.id === id) || null;
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
    if (data.initialSocialUrl) {
      try {
        const extracted = await extractLocationsFromSocialUrl(data.initialSocialUrl);
        const sourceId = `src-${Date.now()}`;
        const source: TripSource = {
          id: sourceId,
          tripId,
          ...extracted.source,
          createdAt: new Date().toISOString(),
        };
        const places: Place[] = extracted.places.map((p, idx) => ({
          ...p,
          id: `p-${Date.now()}-${idx}`,
          tripId,
          sourceId,
          assignedDay: (idx % data.durationDays) + 1,
          timeSlot: (idx % 3 === 0 ? 'morning' : idx % 3 === 1 ? 'afternoon' : 'evening') as TimeSlot,
          createdAt: new Date().toISOString(),
        }));

        newTrip.sources = [source];
        newTrip.places = places;
        if (places[0]?.imageUrl) {
          newTrip.coverImage = places[0].imageUrl;
        }
      } catch (err) {
        console.warn('[TripService] Initial social URL extraction failed:', err);
      }
    }

    trips.unshift(newTrip);
    saveLocalTrips(trips);
    return newTrip;
  },

  async deleteTrip(tripId: string): Promise<void> {
    const trips = loadLocalTrips().filter((t) => t.id !== tripId);
    saveLocalTrips(trips);
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

    trip.sources = [newSource, ...trip.sources];
    trip.places = [...newPlaces, ...trip.places];
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
