'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface RoadmapItem {
  id: string;
  userId: string;
  title: string;
  targetDomain: string;
  targetDate?: string | null;
  dailyMinutes: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Fetches active (non-archived, non-abandoned) roadmaps for the learner.
 * Cached with 5min staleTime; renders instantly on tab focus with zero reload.
 */
export function useActiveGoalsQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.goals.active(userId),
    queryFn: async (): Promise<RoadmapItem[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'abandoned')
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((g) => ({
        id: g.id,
        userId: g.user_id,
        title: g.title,
        targetDomain: g.target_domain,
        targetDate: g.target_date,
        dailyMinutes: g.daily_minutes,
        status: g.status,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      }));
    },
    enabled: !!userId,
  });
}

/**
 * Fetches archived / abandoned roadmaps for the learner.
 */
export function useArchivedGoalsQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.goals.archived(userId),
    queryFn: async (): Promise<RoadmapItem[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['abandoned', 'archived'])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((g) => ({
        id: g.id,
        userId: g.user_id,
        title: g.title,
        targetDomain: g.target_domain,
        targetDate: g.target_date,
        dailyMinutes: g.daily_minutes,
        status: g.status,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      }));
    },
    enabled: !!userId,
  });
}

/**
 * Mutation to archive a goal: updates learning_journeys and learning_goals,
 * then cleanly invalidates active, archived, learningMap, and dashboard queries.
 */
export function useArchiveGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, userId }: { goalId: string; userId: string }) => {
      // 1. Archive associated journeys first
      await supabase
        .from('learning_journeys')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('goal_id', goalId);

      // 2. Archive goal (attempt 'archived', fallback to 'abandoned')
      let { error } = await supabase
        .from('learning_goals')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('user_id', userId);

      if (error) {
        const fallback = await supabase
          .from('learning_goals')
          .update({ status: 'abandoned', updated_at: new Date().toISOString() })
          .eq('id', goalId)
          .eq('user_id', userId);
        if (fallback.error) throw fallback.error;
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview(userId) });
      queryClient.invalidateQueries({ queryKey: ['learning-map', userId] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ghoomo:roadmap-updated'));
      }
    },
  });
}

/**
 * Mutation to restore an archived goal: restores learning_journeys and learning_goals.
 */
export function useRestoreGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, userId }: { goalId: string; userId: string }) => {
      // 1. Restore associated journeys
      await supabase
        .from('learning_journeys')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('goal_id', goalId);

      // 2. Restore goal
      const { error } = await supabase
        .from('learning_goals')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview(userId) });
      queryClient.invalidateQueries({ queryKey: ['learning-map', userId] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ghoomo:roadmap-updated'));
      }
    },
  });
}

/**
 * Mutation for cascading permanent deletion of a roadmap and all its child nodes.
 */
export function useDeleteGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, userId }: { goalId: string; userId: string }) => {
      // 1. Fetch journeys for this goal
      const { data: journeys } = await supabase
        .from('learning_journeys')
        .select('id')
        .eq('goal_id', goalId);

      const journeyIds = (journeys || []).map((j: any) => j.id);

      if (journeyIds.length > 0) {
        // 2. Concepts cleanup
        const { data: concepts } = await supabase
          .from('concepts')
          .select('id')
          .in('journey_id', journeyIds);

        const conceptIds = (concepts || []).map((c: any) => c.id);

        if (conceptIds.length > 0) {
          await supabase.from('learner_concept_state').delete().in('concept_id', conceptIds);
          await supabase.from('concept_prerequisites').delete().in('concept_id', conceptIds);
          await supabase.from('concept_prerequisites').delete().in('prerequisite_concept_id', conceptIds);
          await supabase.from('evidence').delete().in('concept_id', conceptIds);
        }

        // 3. Activities cleanup
        const { data: activities } = await supabase
          .from('learning_activities')
          .select('id')
          .in('journey_id', journeyIds);

        const activityIds = (activities || []).map((a: any) => a.id);
        if (activityIds.length > 0) {
          await supabase.from('attempts').delete().in('activity_id', activityIds);
          await supabase.from('questions').delete().in('activity_id', activityIds);
        }

        await supabase.from('learning_activities').delete().in('journey_id', journeyIds);
        await supabase.from('concepts').delete().in('journey_id', journeyIds);
        await supabase.from('route_events').delete().in('journey_id', journeyIds);
        await supabase.from('learning_journeys').delete().in('id', journeyIds);
      }

      // 4. Delete goal
      const { error } = await supabase
        .from('learning_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview(userId) });
      queryClient.invalidateQueries({ queryKey: ['learning-map', userId] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ghoomo:roadmap-updated'));
      }
    },
  });
}
