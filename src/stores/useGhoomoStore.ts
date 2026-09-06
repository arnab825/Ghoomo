import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
import { generateProximityItinerary } from '@/features/itinerary/clustering';
import { SAMPLE_VIRAL_REELS } from '@/features/social-import/sampleReels';

interface GhoomoState {
  trips: GhoomoTrip[];
  activeTripId: string | null;

  // Actions
  setActiveTrip: (tripId: string) => void;
  createTrip: (data: {
    title: string;
    destinationRegion: string;
    startDate?: string;
    durationDays: number;
    budgetTotal: number;
    travelStyle: 'solo' | 'couple' | 'friends' | 'family';
    initialSocialUrl?: string;
  }) => Promise<string>;
  deleteTrip: (tripId: string) => void;

  // Places & Sources
  importSocialUrl: (tripId: string, url: string) => Promise<void>;
  addPlace: (tripId: string, place: Omit<Place, 'id' | 'tripId' | 'createdAt'>) => void;
  updatePlaceConfidence: (tripId: string, placeId: string, confidence: number) => void;
  deletePlace: (tripId: string, placeId: string) => void;

  // Itinerary
  autoGenerateItinerary: (tripId: string) => void;
  setTripItinerary: (tripId: string, days: ItineraryDay[], updatedPlaces?: Place[]) => void;
  movePlaceToDay: (tripId: string, placeId: string, targetDayNumber: number | undefined, timeSlot?: TimeSlot) => void;

  // Collaboration
  inviteCollaborator: (tripId: string, email: string, role: CollabRole) => void;
  removeCollaborator: (tripId: string, collaboratorId: string) => void;

  // Budget
  addBudgetItem: (tripId: string, item: Omit<BudgetItem, 'id' | 'tripId'>) => void;
  toggleBudgetItemPaid: (tripId: string, itemId: string) => void;
  deleteBudgetItem: (tripId: string, itemId: string) => void;

  // Checklist
  addChecklistItem: (tripId: string, item: Omit<ChecklistItem, 'id' | 'tripId' | 'isCompleted'>) => void;
  toggleChecklistItem: (tripId: string, itemId: string) => void;
  deleteChecklistItem: (tripId: string, itemId: string) => void;
}

export const useGhoomoStore = create<GhoomoState>()(
  persist(
    (set, get) => ({
      trips: [],
      activeTripId: null,

      setActiveTrip: (tripId) => {
        set({ activeTripId: tripId });
      },

      createTrip: async (data) => {
        const tripId = `trip-${Date.now()}`;
        const newDays: ItineraryDay[] = Array.from({ length: data.durationDays }, (_, i) => ({
          id: `day-${i + 1}-${tripId}`,
          tripId,
          dayNumber: i + 1,
          theme: `Day ${i + 1}: ${data.destinationRegion} Exploration`,
          items: [],
        }));

        const newTrip: GhoomoTrip = {
          id: tripId,
          userId: 'user-demo-aarav',
          title: data.title,
          destinationRegion: data.destinationRegion,
          startDate: data.startDate || new Date().toISOString().split('T')[0],
          durationDays: data.durationDays,
          budgetTotal: data.budgetTotal,
          travelStyle: data.travelStyle,
          coverImage:
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
          status: 'planned',
          sources: [],
          places: [],
          days: newDays,
          collaborators: [
            {
              id: 'collab-owner',
              name: 'Aarav Patel (You)',
              email: 'aarav@ghoomo.travel',
              role: 'editor',
              status: 'accepted',
            },
          ],
          budgetItems: [],
          checklistItems: [
            {
              id: `c-init-1-${tripId}`,
              tripId,
              category: 'documents',
              title: 'Govt Photo ID proof (Aadhaar / Passport)',
              isCompleted: false,
            },
            {
              id: `c-init-2-${tripId}`,
              tripId,
              category: 'packing',
              title: 'Portable power bank and universal charger',
              isCompleted: false,
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          trips: [newTrip, ...state.trips],
          activeTripId: tripId,
        }));

        // If an initial social URL was provided during creation, import it automatically
        if (data.initialSocialUrl && data.initialSocialUrl.trim() !== '') {
          await get().importSocialUrl(tripId, data.initialSocialUrl.trim());
        }

        return tripId;
      },

      deleteTrip: (tripId) => {
        set((state) => {
          const remaining = state.trips.filter((t) => t.id !== tripId);
          return {
            trips: remaining,
            activeTripId: remaining.length > 0 ? remaining[0].id : null,
          };
        });
      },

      importSocialUrl: async (tripId, url) => {
        const extraction = await extractLocationsFromSocialUrl(url);

        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          const sourceId = `src-${Date.now()}`;
          const newSource: TripSource = {
            ...extraction.source,
            id: sourceId,
            tripId,
            createdAt: new Date().toISOString(),
          };

          const newPlaces: Place[] = extraction.places.map((p, idx) => ({
            ...p,
            id: `place-${Date.now()}-${idx}`,
            tripId,
            sourceId,
            createdAt: new Date().toISOString(),
          }));

          const combinedPlaces = [...trip.places, ...newPlaces];

          // Use the extraction thumbnail as cover image if none was set
          const coverImage =
            trip.sources.length === 0 && extraction.source.thumbnailUrl
              ? extraction.source.thumbnailUrl
              : trip.coverImage;

          const updatedTrip: GhoomoTrip = {
            ...trip,
            coverImage,
            sources: [...trip.sources, newSource],
            places: combinedPlaces,
            updatedAt: new Date().toISOString(),
          };

          return {
            trips: state.trips.map((t) => (t.id === tripId ? updatedTrip : t)),
          };
        });

        // Automatically run proximity clustering to organize newly imported places
        get().autoGenerateItinerary(tripId);
      },

      addPlace: (tripId, placeData) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          const newPlace: Place = {
            ...placeData,
            id: `place-${Date.now()}`,
            tripId,
            createdAt: new Date().toISOString(),
          };

          const updatedTrip: GhoomoTrip = {
            ...trip,
            places: [...trip.places, newPlace],
            updatedAt: new Date().toISOString(),
          };

          return {
            trips: state.trips.map((t) => (t.id === tripId ? updatedTrip : t)),
          };
        });

        get().autoGenerateItinerary(tripId);
      },

      updatePlaceConfidence: (tripId, placeId, confidence) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          const updatedPlaces = trip.places.map((p) =>
            p.id === placeId ? { ...p, confidence: Math.max(0, Math.min(1, confidence)) } : p
          );

          // Update places embedded in itinerary days as well
          const updatedDays = trip.days.map((day) => ({
            ...day,
            items: day.items.map((item) =>
              item.placeId === placeId && item.place
                ? { ...item, place: { ...item.place, confidence } }
                : item
            ),
          }));

          return {
            trips: state.trips.map((t) =>
              t.id === tripId
                ? { ...t, places: updatedPlaces, days: updatedDays, updatedAt: new Date().toISOString() }
                : t
            ),
          };
        });
      },

      deletePlace: (tripId, placeId) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          const filteredPlaces = trip.places.filter((p) => p.id !== placeId);
          const filteredDays = trip.days.map((day) => ({
            ...day,
            items: day.items.filter((item) => item.placeId !== placeId),
          }));

          return {
            trips: state.trips.map((t) =>
              t.id === tripId
                ? { ...t, places: filteredPlaces, days: filteredDays, updatedAt: new Date().toISOString() }
                : t
            ),
          };
        });
      },

      autoGenerateItinerary: (tripId) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          const { days, updatedPlaces } = generateProximityItinerary(
            trip.places,
            trip.durationDays,
            tripId
          );

          return {
            trips: state.trips.map((t) =>
              t.id === tripId
                ? { ...t, days, places: updatedPlaces, updatedAt: new Date().toISOString() }
                : t
            ),
          };
        });
      },

      setTripItinerary: (tripId, days, updatedPlaces) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          return {
            trips: state.trips.map((t) =>
              t.id === tripId
                ? {
                    ...t,
                    days,
                    places: updatedPlaces || t.places,
                    updatedAt: new Date().toISOString(),
                  }
                : t
            ),
          };
        });
      },

      movePlaceToDay: (tripId, placeId, targetDayNumber, timeSlot = 'morning') => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          const place = trip.places.find((p) => p.id === placeId);
          if (!place) return state;

          // Remove place from all days first
          const cleanedDays = trip.days.map((day) => ({
            ...day,
            items: day.items.filter((item) => item.placeId !== placeId),
          }));

          if (targetDayNumber !== undefined) {
            const targetDay = cleanedDays.find((d) => d.dayNumber === targetDayNumber);
            if (targetDay) {
              const updatedPlace: Place = {
                ...place,
                assignedDay: targetDayNumber,
                timeSlot,
              };

              targetDay.items.push({
                id: `item-${Date.now()}`,
                dayId: targetDay.id,
                placeId,
                orderIndex: targetDay.items.length,
                timeSlot,
                durationMinutes: 90,
                place: updatedPlace,
              });
            }
          }

          const updatedPlaces = trip.places.map((p) =>
            p.id === placeId ? { ...p, assignedDay: targetDayNumber, timeSlot } : p
          );

          return {
            trips: state.trips.map((t) =>
              t.id === tripId
                ? { ...t, days: cleanedDays, places: updatedPlaces, updatedAt: new Date().toISOString() }
                : t
            ),
          };
        });
      },

      inviteCollaborator: (tripId, email, role) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          const newCollab = {
            id: `collab-${Date.now()}`,
            name: email.split('@')[0],
            email,
            role,
            status: 'pending' as const,
          };

          return {
            trips: state.trips.map((t) =>
              t.id === tripId
                ? {
                    ...t,
                    collaborators: [...t.collaborators, newCollab],
                    updatedAt: new Date().toISOString(),
                  }
                : t
            ),
          };
        });
      },

      removeCollaborator: (tripId, collaboratorId) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          return {
            trips: state.trips.map((t) =>
              t.id === tripId
                ? {
                    ...t,
                    collaborators: t.collaborators.filter((c) => c.id !== collaboratorId),
                    updatedAt: new Date().toISOString(),
                  }
                : t
            ),
          };
        });
      },

      addBudgetItem: (tripId, item) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          const newItem: BudgetItem = {
            ...item,
            id: `budget-${Date.now()}`,
            tripId,
          };

          return {
            trips: state.trips.map((t) =>
              t.id === tripId
                ? { ...t, budgetItems: [...t.budgetItems, newItem], updatedAt: new Date().toISOString() }
                : t
            ),
          };
        });
      },

      toggleBudgetItemPaid: (tripId, itemId) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          return {
            trips: state.trips.map((t) =>
              t.id === tripId
                ? {
                    ...t,
                    budgetItems: t.budgetItems.map((b) =>
                      b.id === itemId ? { ...b, isPaid: !b.isPaid } : b
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : t
            ),
          };
        });
      },

      deleteBudgetItem: (tripId, itemId) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          return {
            trips: state.trips.map((t) =>
              t.id === tripId
                ? {
                    ...t,
                    budgetItems: t.budgetItems.filter((b) => b.id !== itemId),
                    updatedAt: new Date().toISOString(),
                  }
                : t
            ),
          };
        });
      },

      addChecklistItem: (tripId, item) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          const newItem: ChecklistItem = {
            ...item,
            id: `chk-${Date.now()}`,
            tripId,
            isCompleted: false,
          };

          return {
            trips: state.trips.map((t) =>
              t.id === tripId
                ? { ...t, checklistItems: [...t.checklistItems, newItem], updatedAt: new Date().toISOString() }
                : t
            ),
          };
        });
      },

      toggleChecklistItem: (tripId, itemId) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          return {
            trips: state.trips.map((t) =>
              t.id === tripId
                ? {
                    ...t,
                    checklistItems: t.checklistItems.map((c) =>
                      c.id === itemId ? { ...c, isCompleted: !c.isCompleted } : c
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : t
            ),
          };
        });
      },

      deleteChecklistItem: (tripId, itemId) => {
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;

          return {
            trips: state.trips.map((t) =>
              t.id === tripId
                ? {
                    ...t,
                    checklistItems: t.checklistItems.filter((c) => c.id !== itemId),
                    updatedAt: new Date().toISOString(),
                  }
                : t
            ),
          };
        });
      },
    }),
    {
      name: 'ghoomo-trips-storage',
    }
  )
);
