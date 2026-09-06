/**
 * TanStack Query Hooks for Smart Learning Journeys
 * Centralized cache invalidation and mutation state management.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  learningService,
  getInitialDemoJourney,
  FLAGSHIP_KOLKATA_JOURNEY_ID,
} from '@/lib/services/learningService';
import { GenerateJourneyParams, LearningJourney } from '@/lib/types/learning';

export const LEARNING_KEYS = {
  all: ['learning_journeys'] as const,
  detail: (id: string) => ['learning_journey', id] as const,
};

export function useLearningJourneys() {
  return useQuery({
    queryKey: LEARNING_KEYS.all,
    queryFn: () => learningService.getAllJourneys(),
    initialData: [getInitialDemoJourney()],
    staleTime: 30 * 1000,
  });
}

export function useLearningJourney(id: string) {
  return useQuery({
    queryKey: LEARNING_KEYS.detail(id),
    queryFn: () => learningService.getJourneyById(id),
    initialData: id === FLAGSHIP_KOLKATA_JOURNEY_ID ? getInitialDemoJourney() : undefined,
    staleTime: 30 * 1000,
    enabled: !!id,
  });
}

export function useCreateJourneyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: GenerateJourneyParams) => learningService.createJourney(params),
    onSuccess: (newJourney) => {
      queryClient.invalidateQueries({ queryKey: LEARNING_KEYS.all });
      queryClient.setQueryData(LEARNING_KEYS.detail(newJourney.id), newJourney);
    },
  });
}

export function useUpdateActivityStatusMutation(journeyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
      status,
      submission,
    }: {
      activityId: string;
      status: 'pending' | 'in_progress' | 'completed';
      submission?: { text?: string; score?: number; aiFeedback?: string };
    }) => learningService.updateActivityStatus(journeyId, activityId, status, submission),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.setQueryData(LEARNING_KEYS.detail(journeyId), updated);
        queryClient.invalidateQueries({ queryKey: LEARNING_KEYS.all });
      }
    },
  });
}

export function useSubmitQuizAnswerMutation(journeyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
      questionId,
      selectedAnswer,
    }: {
      activityId: string;
      questionId: string;
      selectedAnswer: string | number;
    }) => learningService.submitQuizAnswer(journeyId, activityId, questionId, selectedAnswer),
    onSuccess: ({ journey }) => {
      if (journey) {
        queryClient.setQueryData(LEARNING_KEYS.detail(journeyId), journey);
        queryClient.invalidateQueries({ queryKey: LEARNING_KEYS.all });
      }
    },
  });
}

export function useAddReflectionMutation(journeyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
      prompt,
      studentResponse,
      aiFeedback,
    }: {
      activityId?: string;
      prompt: string;
      studentResponse: string;
      aiFeedback?: string;
    }) => learningService.addReflection(journeyId, activityId, prompt, studentResponse, aiFeedback),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.setQueryData(LEARNING_KEYS.detail(journeyId), updated);
        queryClient.invalidateQueries({ queryKey: LEARNING_KEYS.all });
      }
    },
  });
}

export function useToggleChecklistItemMutation(journeyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
      checklistItemId,
      checked,
    }: {
      activityId: string;
      checklistItemId: string;
      checked: boolean;
    }) => learningService.toggleChecklistItem(journeyId, activityId, checklistItemId, checked),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.setQueryData(LEARNING_KEYS.detail(journeyId), updated);
        queryClient.invalidateQueries({ queryKey: LEARNING_KEYS.all });
      }
    },
  });
}

export function useDeleteJourneyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (journeyId: string) => learningService.deleteJourney(journeyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEARNING_KEYS.all });
    },
  });
}
