'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface DashboardGoalItem {
  id: string;
  title: string;
  targetDomain: string;
  dailyMinutes: number;
  createdAt: string;
  journeyId?: string;
  conceptCount: number;
  masteredCount: number;
  firstActivityId?: string;
}

export interface DashboardAttemptItem {
  id: string;
  activityTitle: string;
  isCorrect: boolean;
  score: number;
  timeSpentSeconds: number;
  createdAt: string;
}

export interface DashboardPriorityActivity {
  id: string;
  title: string;
  conceptName: string;
  courseTitle: string;
}

export interface DashboardAnalyticsData {
  goals: DashboardGoalItem[];
  recentAttempts: DashboardAttemptItem[];
  currentPriorityActivity: DashboardPriorityActivity | null;
  masteryStats: {
    totalConcepts: number;
    mastered: number;
    inProgress: number;
    needsReview: number;
    notStarted: number;
    masteryRate: number;
    accuracyRate: number;
    totalAttemptsCount: number;
    estimatedMinutesSaved: number;
  };
}

export function useDashboardQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.overview(userId),
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<DashboardAnalyticsData> => {
      const defaultStats = {
        totalConcepts: 0,
        mastered: 0,
        inProgress: 0,
        needsReview: 0,
        notStarted: 0,
        masteryRate: 0,
        accuracyRate: 100,
        totalAttemptsCount: 0,
        estimatedMinutesSaved: 0,
      };

      if (!userId) {
        return {
          goals: [],
          recentAttempts: [],
          currentPriorityActivity: null,
          masteryStats: defaultStats,
        };
      }

      // 1. Fetch active goals
      const { data: goalsData } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'abandoned')
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      const activeGoals = goalsData || [];
      if (activeGoals.length === 0) {
        return {
          goals: [],
          recentAttempts: [],
          currentPriorityActivity: null,
          masteryStats: defaultStats,
        };
      }

      const goalIds = activeGoals.map((g) => g.id);

      // 2. Fetch associated non-archived journeys
      const { data: journeysData } = await supabase
        .from('learning_journeys')
        .select('*')
        .in('goal_id', goalIds)
        .neq('status', 'archived');

      const journeys = journeysData || [];
      const journeyIds = journeys.map((j) => j.id);

      if (journeyIds.length === 0) {
        return {
          goals: activeGoals.map((g) => ({
            id: g.id,
            title: g.title,
            targetDomain: g.target_domain,
            dailyMinutes: g.daily_minutes,
            createdAt: g.created_at,
            conceptCount: 0,
            masteredCount: 0,
          })),
          recentAttempts: [],
          currentPriorityActivity: null,
          masteryStats: defaultStats,
        };
      }

      // 3. Parallel fetch: concepts, activities, learner states, attempts
      const [conceptsRes, actRes, statesRes, attemptsRes] = await Promise.all([
        supabase.from('concepts').select('*').in('journey_id', journeyIds),
        supabase.from('learning_activities').select('*').in('journey_id', journeyIds).order('order_index', { ascending: true }),
        supabase.from('learner_concept_state').select('*').eq('user_id', userId),
        supabase.from('attempts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(6),
      ]);

      const concepts = conceptsRes.data || [];
      const activities = actRes.data || [];
      const states = statesRes.data || [];
      const attempts = attemptsRes.data || [];

      const stateMap = new Map<string, string>();
      for (const s of states) {
        stateMap.set(s.concept_id, s.state);
      }

      // Fast calculations
      let totalMastered = 0;
      let totalInProgress = 0;
      let totalNeedsReview = 0;
      let totalNotStarted = 0;

      concepts.forEach((c) => {
        const s = stateMap.get(c.id);
        if (s === 'MASTERED') totalMastered++;
        else if (s === 'DEVELOPING' || s === 'PROVISIONALLY_READY') totalInProgress++;
        else if (s === 'NEEDS_REVIEW') totalNeedsReview++;
        else totalNotStarted++;
      });

      const totalConcepts = concepts.length;
      const masteryRate = totalConcepts > 0 ? Math.round((totalMastered / totalConcepts) * 100) : 0;
      const correctAttempts = attempts.filter((a) => a.is_correct).length;
      const accuracyRate = attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 100;
      const estimatedMinutesSaved = totalMastered * 12;

      // Find first unmastered activity as next priority
      let nextPriority: DashboardPriorityActivity | null = null;
      for (const act of activities) {
        const cState = stateMap.get(act.concept_id);
        if (cState !== 'MASTERED') {
          const conceptObj = concepts.find((c) => c.id === act.concept_id);
          const journeyObj = journeys.find((j) => j.id === act.journey_id);
          nextPriority = {
            id: act.id,
            title: act.title,
            conceptName: conceptObj?.name || 'Current Topic',
            courseTitle: journeyObj?.title || 'Learning Roadmap',
          };
          break;
        }
      }

      // Assemble assembled goals
      const assembledGoals: DashboardGoalItem[] = activeGoals.map((g) => {
        const journey = journeys.find((j) => j.goal_id === g.id);
        const journeyConcepts = journey ? concepts.filter((c) => c.journey_id === journey.id) : [];
        const jMastered = journeyConcepts.filter((c) => stateMap.get(c.id) === 'MASTERED').length;
        const journeyActs = journey ? activities.filter((a) => a.journey_id === journey.id) : [];
        const firstActId = journeyActs.length > 0 ? journeyActs[0].id : undefined;

        return {
          id: g.id,
          title: g.title,
          targetDomain: g.target_domain,
          dailyMinutes: g.daily_minutes,
          createdAt: g.created_at,
          journeyId: journey?.id,
          conceptCount: journeyConcepts.length,
          masteredCount: jMastered,
          firstActivityId: firstActId,
        };
      });

      // Assemble recent attempt items
      const assembledAttempts: DashboardAttemptItem[] = attempts.map((att) => {
        const act = activities.find((a) => a.id === att.activity_id);
        return {
          id: att.id,
          activityTitle: act?.title || 'Practice Drill',
          isCorrect: att.is_correct,
          score: att.score || 0,
          timeSpentSeconds: att.time_spent_seconds || 0,
          createdAt: att.created_at,
        };
      });

      return {
        goals: assembledGoals,
        recentAttempts: assembledAttempts,
        currentPriorityActivity: nextPriority,
        masteryStats: {
          totalConcepts,
          mastered: totalMastered,
          inProgress: totalInProgress,
          needsReview: totalNeedsReview,
          notStarted: totalNotStarted,
          masteryRate,
          accuracyRate,
          totalAttemptsCount: attempts.length,
          estimatedMinutesSaved,
        },
      };
    },
    enabled: !!userId,
  });
}
