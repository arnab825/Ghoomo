'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  Calendar,
  Loader2,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getStudentDashboardStats,
  getStudentAssignedJourneys,
} from '@/lib/services/journeyDbService';

export default function StudentDashboardPage() {
  const { user, isLoading: authLoading, isAuthorized } = useAuthGuard({ requiredRole: 'student' });

  const [stats, setStats] = useState<{
    assignedCount: number;
    inProgressCount: number;
    completedCount: number;
    overallMastery: number;
    recentActivities: Array<{
      journey_title: string;
      score: number;
      completed_at: string;
    }>;
  }>({
    assignedCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    overallMastery: 0,
    recentActivities: [],
  });

  const [assignedJourneys, setAssignedJourneys] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function load() {
      setIsDataLoading(true);
      try {
        const [dashStats, journeys] = await Promise.all([
          getStudentDashboardStats(user!.id),
          getStudentAssignedJourneys(user!.id),
        ]);
        if (isMounted) {
          setStats(dashStats);
          setAssignedJourneys(journeys);
        }
      } catch (err) {
        console.error('Failed to load student dashboard data:', err);
      } finally {
        if (isMounted) setIsDataLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-semibold text-slate-500">Verifying student credentials...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 mb-2">
            <span>Student Learning Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Welcome, {user?.fullName || 'Student'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your assigned experiential learning journeys, field missions, and mastery tracker.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/student/reflections">
            <Button variant="outline" className="text-xs font-semibold py-2 px-3.5 rounded-xl">
              <Sparkles size={14} className="mr-1.5 text-indigo-600 dark:text-indigo-400" />
              <span>My AI Reflections</span>
            </Button>
          </Link>
          <Link href="/student/progress">
            <Button variant="outline" className="text-xs font-semibold py-2 px-3.5 rounded-xl">
              <TrendingUp size={14} className="mr-1.5 text-emerald-600 dark:text-emerald-400" />
              <span>Scorecard</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assigned */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Assigned Journeys
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isDataLoading ? '—' : stats.assignedCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Assigned by your teachers</p>
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              In Progress
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isDataLoading ? '—' : stats.inProgressCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Missions actively underway</p>
          </div>
        </div>

        {/* Card 3: Completed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Completed
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isDataLoading ? '—' : stats.completedCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Finished all 3 stages</p>
          </div>
        </div>

        {/* Card 4: Overall Mastery */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Average Quiz Score
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isDataLoading ? '—' : `${stats.overallMastery}%`}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Comprehension checkpoints</p>
          </div>
        </div>
      </div>

      {/* Main Section: Assigned Journeys */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              My Assigned Learning Journeys
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a journey to open the interactive Before → During → After learning workspace.
            </p>
          </div>
        </div>

        {isDataLoading ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading your assigned journeys from database...</p>
          </div>
        ) : assignedJourneys.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <BookOpen size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No learning journeys assigned yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                When your teacher assigns a journey, it will appear right here with all your missions, quizzes, and reflection prompts.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignedJourneys.map((item) => {
              const j = item.journey;
              return (
                <div
                  key={item.assignmentId}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-shadow"
                >
                  {j.cover_image && (
                    <div className="h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                      <img
                        src={j.cover_image}
                        alt={j.title}
                        className="h-full w-full object-cover"
                      />
                      <span
                        className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase backdrop-blur-xs ${
                          item.status === 'completed'
                            ? 'bg-emerald-500 text-white'
                            : item.status === 'in_progress'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/90 text-slate-700 dark:bg-slate-900/90 dark:text-slate-200'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                          {j.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {j.grade_level}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">
                          {j.difficulty}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                        {j.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {j.description}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">
                          {item.completedActivities} of {item.totalActivities} activities done
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.progressPercentage}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${item.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link href={`/student/journeys/${j.id}`} className="block">
                        <Button
                          className={`w-full text-xs font-semibold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                            item.status === 'completed'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                          }`}
                        >
                          <Play size={13} />
                          <span>
                            {item.status === 'completed'
                              ? 'Review Completed Journey'
                              : item.status === 'in_progress'
                              ? 'Resume Journey'
                              : 'Start Journey'}
                          </span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
