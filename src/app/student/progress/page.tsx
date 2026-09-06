'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStudentDashboardStats } from '@/lib/services/journeyDbService';

export default function StudentProgressPage() {
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

  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function load() {
      setIsDataLoading(true);
      try {
        const data = await getStudentDashboardStats(user!.id);
        if (isMounted) setStats(data);
      } catch (err) {
        console.error('Failed to load progress stats:', err);
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
        <p className="text-xs font-semibold text-slate-500">Checking credentials...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 mb-2">
            <span>Academic Performance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            My Learning Progress & Mastery
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your comprehension checkpoint performance and completed milestones.
          </p>
        </div>

        <Link href="/student/dashboard">
          <Button variant="outline" className="text-xs font-semibold py-2 px-3.5 rounded-xl">
            <ArrowLeft size={14} className="mr-1.5" />
            <span>Dashboard</span>
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Total Assigned</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {isDataLoading ? '—' : stats.assignedCount}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">In Progress</span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {isDataLoading ? '—' : stats.inProgressCount}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Completed</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {isDataLoading ? '—' : stats.completedCount}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Average Quiz Mastery</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {isDataLoading ? '—' : `${stats.overallMastery}%`}
          </div>
        </div>
      </div>

      {/* Recent Completions */}
      <div className="p-6 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          Completed Milestones & Quizzes
        </h3>

        {isDataLoading ? (
          <div className="p-8 text-center">
            <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto" />
          </div>
        ) : stats.recentActivities.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1">
            <CheckCircle2 size={24} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="font-semibold text-slate-600 dark:text-slate-400">No completed milestones yet</p>
            <p className="text-[11px] text-slate-400">
              As you complete activities and answer checkpoint quizzes in your assigned journeys, your scores will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.recentActivities.map((act, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {act.journey_title}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar size={11} />
                    <span>{new Date(act.completed_at).toLocaleDateString()}</span>
                  </span>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    act.score >= 80
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {act.score}% Score
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
