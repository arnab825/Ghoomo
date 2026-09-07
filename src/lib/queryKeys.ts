/**
 * Ghoomo Centralized Query Keys Factory
 * Provides type-safe, hierarchical query keys for TanStack Query caching.
 */

export const queryKeys = {
  goals: {
    all: (userId?: string) => ['goals', userId ?? 'anonymous'] as const,
    active: (userId?: string) => ['goals', 'active', userId ?? 'anonymous'] as const,
    archived: (userId?: string) => ['goals', 'archived', userId ?? 'anonymous'] as const,
    detail: (goalId?: string) => ['goals', 'detail', goalId ?? ''] as const,
  },
  learningMap: {
    byGoal: (userId?: string, goalId?: string) =>
      ['learning-map', userId ?? 'anonymous', goalId ?? 'ALL'] as const,
  },
  dashboard: {
    overview: (userId?: string) => ['dashboard', 'overview', userId ?? 'anonymous'] as const,
  },
  activities: {
    detail: (activityId?: string) => ['activity', 'detail', activityId ?? ''] as const,
  },
} as const;
