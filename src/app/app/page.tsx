'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  Plus,
  Target,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Award,
  Zap,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Archive,
  BarChart3,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/shared/EmptyState';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { supabase } from '@/lib/supabase/client';

interface GoalItem {
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

interface AttemptItem {
  id: string;
  activityTitle: string;
  isCorrect: boolean;
  score: number;
  timeSpentSeconds: number;
  createdAt: string;
}

export default function AppDashboard() {
  const { user } = useAuthStore();
  const { setGoalWizardOpen } = useUIStore();

  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<AttemptItem[]>([]);
  const [masteryStats, setMasteryStats] = useState({
    totalConcepts: 0,
    mastered: 0,
    inProgress: 0,
    needsReview: 0,
    notStarted: 0,
    masteryRate: 0,
    accuracyRate: 100,
    totalAttemptsCount: 0,
    estimatedMinutesSaved: 0,
  });
  const [currentPriorityActivity, setCurrentPriorityActivity] = useState<{
    id: string;
    title: string;
    conceptName: string;
    courseTitle: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function fetchDashboardAnalytics() {
      setIsLoading(true);
      try {
        // 1. Fetch active goals for user
        const { data: goalsData } = await supabase
          .from('learning_goals')
          .select('*')
          .eq('user_id', user!.id)
          .neq('status', 'abandoned')
          .neq('status', 'archived')
          .order('created_at', { ascending: false });

        const activeGoals = goalsData || [];

        if (activeGoals.length === 0) {
          if (isMounted) {
            setGoals([]);
            setIsLoading(false);
          }
          return;
        }

        const goalIds = activeGoals.map((g) => g.id);

        // 2. Fetch associated journeys
        const { data: journeysData } = await supabase
          .from('learning_journeys')
          .select('*')
          .in('goal_id', goalIds);

        const journeys = journeysData || [];
        const journeyIds = journeys.map((j) => j.id);

        // 3. Fetch concepts and activities for these journeys
        const { data: conceptsData } = await supabase
          .from('concepts')
          .select('*')
          .in('journey_id', journeyIds);

        const concepts = conceptsData || [];

        const { data: activitiesData } = await supabase
          .from('learning_activities')
          .select('*')
          .in('journey_id', journeyIds)
          .order('order_index', { ascending: true });

        const activities = activitiesData || [];

        // 4. Fetch user's real learner concept state
        const { data: statesData } = await supabase
          .from('learner_concept_state')
          .select('*')
          .eq('user_id', user!.id);

        const states = statesData || [];
        const stateMap = new Map<string, string>();
        for (const s of states) {
          stateMap.set(s.concept_id, s.state);
        }

        // 5. Fetch user's recent question attempts
        const { data: attemptsData } = await supabase
          .from('attempts')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(10);

        const attempts = attemptsData || [];

        // 6. Calculate stats
        let totalMastered = 0;
        let totalInProgress = 0;
        let totalNeedsReview = 0;

        for (const c of concepts) {
          const st = stateMap.get(c.id);
          if (st === 'MASTERED') totalMastered++;
          else if (st === 'PROVISIONALLY_READY' || st === 'DEVELOPING') totalInProgress++;
          else if (st === 'NEEDS_REVIEW') totalNeedsReview++;
        }

        const totalConcepts = concepts.length;
        const totalNotStarted = Math.max(0, totalConcepts - (totalMastered + totalInProgress + totalNeedsReview));
        const masteryRate = totalConcepts > 0 ? Math.round((totalMastered / totalConcepts) * 100) : 0;

        const totalAttemptsCount = attempts.length;
        const correctCount = attempts.filter((a) => a.is_correct).length;
        const accuracyRate = totalAttemptsCount > 0 ? Math.round((correctCount / totalAttemptsCount) * 100) : 100;
        const estimatedMinutesSaved = totalMastered * 15; // standard ~15m per mastered milestone

        // 7. Assemble per-goal progress items
        let nextPriority: any = null;

        const assembledGoals: GoalItem[] = activeGoals.map((g) => {
          const journey = journeys.find((j) => j.goal_id === g.id);
          const journeyConcepts = journey ? concepts.filter((c) => c.journey_id === journey.id) : [];
          const jMastered = journeyConcepts.filter((c) => stateMap.get(c.id) === 'MASTERED').length;

          // Find first unmastered activity in this journey
          let firstActId: string | undefined;
          if (journey) {
            const jActivities = activities.filter((a) => a.journey_id === journey.id);
            const pendingAct = jActivities.find((a) => stateMap.get(a.concept_id) !== 'MASTERED') || jActivities[0];
            if (pendingAct) {
              firstActId = pendingAct.id;
              if (!nextPriority) {
                const cName = concepts.find((c) => c.id === pendingAct.concept_id)?.name || 'Next Lesson';
                nextPriority = {
                  id: pendingAct.id,
                  title: pendingAct.title,
                  conceptName: cName,
                  courseTitle: g.title,
                };
              }
            }
          }

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

        // 8. Assemble recent attempt items
        const assembledAttempts: AttemptItem[] = attempts.map((att) => {
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

        if (!isMounted) return;

        setGoals(assembledGoals);
        setRecentAttempts(assembledAttempts);
        setCurrentPriorityActivity(nextPriority);
        setMasteryStats({
          totalConcepts,
          mastered: totalMastered,
          inProgress: totalInProgress,
          needsReview: totalNeedsReview,
          notStarted: totalNotStarted,
          masteryRate,
          accuracyRate,
          totalAttemptsCount,
          estimatedMinutesSaved,
        });
      } catch (err) {
        console.error('Error fetching dashboard analytics:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDashboardAnalytics();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-semibold text-slate-500">
          Loading your learning stats & analytics...
        </p>
      </div>
    );
  }

  // Empty State: 0 Active Goals
  if (goals.length === 0) {
    return (
      <div className="py-12 max-w-2xl mx-auto space-y-6">
        <EmptyState
          icon={<Compass size={28} />}
          title="Ready to Start Learning?"
          description="Create your first study course. Tell us what topic or subject you want to master, and we will create a step-by-step roadmap tailored specifically to you."
          actionLabel="Create Your First Course"
          onAction={() => setGoalWizardOpen(true)}
        />
      </div>
    );
  }

  // Calculate Donut Segments for Mastery Chart
  const circumference = 2 * Math.PI * 40; // r = 40 => circumference ~ 251.32
  const masteredPct = masteryStats.totalConcepts > 0 ? masteryStats.mastered / masteryStats.totalConcepts : 0;
  const inProgressPct = masteryStats.totalConcepts > 0 ? masteryStats.inProgress / masteryStats.totalConcepts : 0;
  const needsReviewPct = masteryStats.totalConcepts > 0 ? masteryStats.needsReview / masteryStats.totalConcepts : 0;

  const masteredStroke = masteredPct * circumference;
  const inProgressStroke = inProgressPct * circumference;
  const needsReviewStroke = needsReviewPct * circumference;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Learning Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track your real-time skill mastery, active study goals, and practice accuracy.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/app/goals">
            <Button variant="outline" size="sm" className="text-xs font-semibold h-9 px-3 rounded-xl">
              <span>All Courses</span>
            </Button>
          </Link>
          <Button
            onClick={() => setGoalWizardOpen(true)}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>New Course</span>
          </Button>
        </div>
      </div>

      {/* 4 Summary Stats Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Active Courses
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {goals.length}
          </div>
          <span className="text-2xs text-slate-500">In-progress learning roads</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Topics Mastered
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {masteryStats.mastered}
            <span className="text-xs font-medium text-slate-400 ml-1">/ {masteryStats.totalConcepts}</span>
          </div>
          <span className="text-2xs text-slate-500">{masteryStats.masteryRate}% total completion</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Question Accuracy
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {masteryStats.accuracyRate}%
          </div>
          <span className="text-2xs text-slate-500">{masteryStats.totalAttemptsCount} total drill attempts</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Time Saved
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            ~{masteryStats.estimatedMinutesSaved}m
          </div>
          <span className="text-2xs text-slate-500">From fast diagnostic skips</span>
        </div>
      </div>

      {/* Recommended Next Step Hero Banner */}
      {currentPriorityActivity && (
        <div className="p-6 rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-2xs font-bold uppercase tracking-wider text-indigo-100 backdrop-blur-xs">
              <Sparkles size={11} />
              <span>Recommended Next Step</span>
            </div>
            <h2 className="text-xl font-bold font-heading">
              {currentPriorityActivity.title}
            </h2>
            <p className="text-xs text-indigo-200">
              Course: <strong className="text-white">{currentPriorityActivity.courseTitle}</strong> • Topic: <span className="text-indigo-100">{currentPriorityActivity.conceptName}</span>
            </p>
          </div>

          <Link href={`/app/learn/${currentPriorityActivity.id}`}>
            <Button className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs h-10 px-5 rounded-xl shadow-sm flex items-center gap-2 shrink-0">
              <span>Continue Lesson</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      )}

      {/* Visual Analytics & Mastery Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Donut Mastery Chart (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={17} className="text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
                Mastery Breakdown
              </h3>
            </div>
            <span className="text-2xs text-slate-400">{masteryStats.totalConcepts} Total Topics</span>
          </div>

          {/* SVG Donut Chart */}
          <div className="flex items-center justify-center py-2">
            <div className="relative h-44 w-44 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring (Not Started) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-slate-100 dark:text-slate-800"
                />

                {/* Mastered Ring (Emerald) */}
                {masteredStroke > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={`${masteredStroke} ${circumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                )}

                {/* In Progress Ring (Indigo) */}
                {inProgressStroke > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#6366f1"
                    strokeWidth="10"
                    strokeDasharray={`${inProgressStroke} ${circumference}`}
                    strokeDashoffset={-masteredStroke}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                )}

                {/* Needs Review Ring (Amber) */}
                {needsReviewStroke > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="10"
                    strokeDasharray={`${needsReviewStroke} ${circumference}`}
                    strokeDashoffset={-(masteredStroke + inProgressStroke)}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                )}
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-heading">
                  {masteryStats.masteryRate}%
                </span>
                <span className="text-3xs uppercase tracking-wider font-bold text-slate-400">
                  Mastered
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Legend Pills */}
          <div className="grid grid-cols-2 gap-2 text-2xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold block">Mastered</span>
              <span className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                {masteryStats.mastered} <span className="text-2xs font-normal">topics</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40">
              <span className="text-indigo-700 dark:text-indigo-300 font-semibold block">In Progress</span>
              <span className="text-base font-bold text-indigo-800 dark:text-indigo-200">
                {masteryStats.inProgress} <span className="text-2xs font-normal">topics</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-amber-700 dark:text-amber-300 font-semibold block">Needs Review</span>
              <span className="text-base font-bold text-amber-800 dark:text-amber-200">
                {masteryStats.needsReview} <span className="text-2xs font-normal">topics</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-semibold block">Not Started</span>
              <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                {masteryStats.notStarted} <span className="text-2xs font-normal">topics</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Active Courses & Progress (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
              Active Courses Progress
            </h3>
            <Link href="/app/goals" className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Manage Courses
            </Link>
          </div>

          <div className="space-y-3">
            {goals.map((g) => {
              const progressPct = g.conceptCount > 0 ? Math.round((g.masteredCount / g.conceptCount) * 100) : 0;

              return (
                <div
                  key={g.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        {g.targetDomain}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading mt-0.5">
                        {g.title}
                      </h4>
                    </div>

                    <Link href={`/app/course/${g.id}`}>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-2xs h-8 px-3 rounded-xl shadow-2xs flex items-center gap-1">
                        <span>Continue</span>
                        <ArrowRight size={12} />
                      </Button>
                    </Link>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-2xs text-slate-500">
                      <span>Course Completion</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{progressPct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-2xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      {g.masteredCount} of {g.conceptCount} milestones mastered
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {g.dailyMinutes} min/day target
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Practice History */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={17} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
              Recent Practice & Quiz Attempts
            </h3>
          </div>
          <span className="text-2xs text-slate-400">Live evidence logs</span>
        </div>

        {recentAttempts.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No quiz attempts yet. Start a lesson drill to record your practice accuracy!
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentAttempts.map((att) => (
              <div key={att.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      att.isCorrect
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {att.isCorrect ? '✓' : '✕'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {att.activityTitle}
                    </span>
                    <span className="text-2xs text-slate-400">
                      {att.createdAt ? new Date(att.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                      att.isCorrect
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {att.isCorrect ? '+1 Mastery Evidence' : 'Needs Review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
