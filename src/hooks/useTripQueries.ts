/**
 * Ghoomo TanStack Query Hooks
 * Manages all server data caching, stale-times, and optimistic/invalidation mutations.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripService } from '@/lib/services/tripService';
import { generateItineraryAction } from '@/app/actions/aiActions';
import { Place, ItineraryDay, TimeSlot, CollabRole, BudgetItem, ChecklistItem } from '@/lib/types/ghoomo';

// ----------------------------------------------------------------------------
// Query Keys
// ----------------------------------------------------------------------------
export const TRIP_KEYS = {
  all: ['trips'] as const,
  detail: (id: string) => ['trip', id] as const,
};

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------
export function useTrips() {
  return useQuery({
    queryKey: TRIP_KEYS.all,
    queryFn: () => tripService.getAllTrips(),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useTrip(tripId: string) {
  return useQuery({
    queryKey: TRIP_KEYS.detail(tripId),
    queryFn: () => tripService.getTripById(tripId),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!tripId,
  });
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------
export function useCreateTripMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof tripService.createTrip>[0]) =>
      tripService.createTrip(data),
    onSuccess: (newTrip) => {
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.all });
      queryClient.setQueryData(TRIP_KEYS.detail(newTrip.id), newTrip);
    },
  });
}

export function useDeleteTripMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tripId: string) => tripService.deleteTrip(tripId),
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.all });
      queryClient.removeQueries({ queryKey: TRIP_KEYS.detail(tripId) });
    },
  });
}

export function useImportSocialUrlMutation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => tripService.importSocialUrl(tripId, url),
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.all });
    },
  });
}

export function useAddPlaceMutation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (place: Omit<Place, 'id' | 'tripId' | 'createdAt'>) =>
      tripService.addPlace(tripId, place),
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.all });
    },
  });
}

export function useUpdatePlaceConfidenceMutation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ placeId, confidence }: { placeId: string; confidence: number }) =>
      tripService.updatePlaceConfidence(tripId, placeId, confidence),
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
    },
  });
}

export function useDeletePlaceMutation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (placeId: string) => tripService.deletePlace(tripId, placeId),
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
    },
  });
}

export function useMovePlaceToDayMutation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      placeId,
      dayNumber,
      timeSlot,
    }: {
      placeId: string;
      dayNumber: number | undefined;
      timeSlot?: TimeSlot;
    }) => tripService.movePlaceToDay(tripId, placeId, dayNumber, timeSlot),
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
    },
  });
}

export function useAutoGenerateItineraryMutation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      destination,
      durationDays,
      places,
    }: {
      destination: string;
      durationDays: number;
      places: Place[];
    }) => {
      // 1. Call 3-Tier AI Fallback Action (Protected by Rate Limiter & Circuit Breaker)
      const res = await generateItineraryAction({
        tripId,
        destination,
        durationDays,
        places,
      });

      if (!res.success && res.error) {
        throw new Error(res.error);
      }

      // 2. Persist to Server Data Service
      const updatedTrip = await tripService.updateItinerary(
        tripId,
        res.data.days,
        res.data.updatedPlaces
      );

      return {
        trip: updatedTrip,
        tierUsed: res.tierUsed,
        validation: res.validation,
        message: res.message,
      };
    },
    onSuccess: ({ trip }) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), trip);
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.all });
    },
  });
}

export function useInviteCollaboratorMutation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: CollabRole }) =>
      tripService.inviteCollaborator(tripId, email, role),
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
    },
  });
}

export function useRemoveCollaboratorMutation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collaboratorId: string) =>
      tripService.removeCollaborator(tripId, collaboratorId),
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
    },
  });
}

export function useBudgetItemMutations(tripId: string) {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: (item: Omit<BudgetItem, 'id' | 'tripId'>) =>
      tripService.addBudgetItem(tripId, item),
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
    },
  });

  const toggle = useMutation({
    mutationFn: (itemId: string) => tripService.toggleBudgetItemPaid(tripId, itemId),
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
    },
  });

  const remove = useMutation({
    mutationFn: (itemId: string) => tripService.deleteBudgetItem(tripId, itemId),
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
    },
  });

  return { add, toggle, remove };
}

export function useChecklistItemMutations(tripId: string) {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: (item: Omit<ChecklistItem, 'id' | 'tripId' | 'isCompleted'>) =>
      tripService.addChecklistItem(tripId, item),
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
    },
  });

  const toggle = useMutation({
    mutationFn: (itemId: string) => tripService.toggleChecklistItem(tripId, itemId),
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
    },
  });

  const remove = useMutation({
    mutationFn: (itemId: string) => tripService.deleteChecklistItem(tripId, itemId),
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
    },
  });

  return { add, toggle, remove };
}
