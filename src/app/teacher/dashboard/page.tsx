'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  BookOpen,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getTeacherDashboardStats,
  getTeacherJourneys,
  DbLearningJourney,
} from '@/lib/services/journeyDbService';

export default function TeacherDashboardPage() {
  const { user, isLoading: authLoading, isAuthorized } = useAuthGuard({ requiredRole: 'teacher' });

  const [stats, setStats] = useState<{
    totalJourneys: number;
    totalAssignments: number;
    completedAssignments: number;
    completionRate: number;
    recentSubmissions: Array<{
      student_name: string;
      journey_title: string;
      score: number;
      completed_at: string;
      response?: string;
    }>;
  }>({
    totalJourneys: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    completionRate: 0,
    recentSubmissions: [],
  });

  const [recentJourneys, setRecentJourneys] = useState<DbLearningJourney[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadData() {
      setIsDataLoading(true);
      try {
        const [dashboardStats, journeys] = await Promise.all([
          getTeacherDashboardStats(user!.id),
          getTeacherJourneys(user!.id),
        ]);
        if (isMounted) {
          setStats(dashboardStats);
          setRecentJourneys(journeys.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load teacher dashboard data:', err);
      } finally {
        if (isMounted) setIsDataLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-semibold text-slate-500">Verifying teacher credentials...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 mb-2">
            <span>Educator Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Welcome back, {user?.fullName || 'Teacher'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your smart learning journeys, track class progress, and review student reflections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/teacher/assignments">
            <Button variant="outline" className="text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer">
              <Users size={14} className="mr-1.5 text-slate-500" />
              <span>Assign Journey</span>
            </Button>
          </Link>
          <Link href="/teacher/journeys/create">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer">
              <Plus size={15} />
              <span>Create Learning Journey</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Journeys */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Journeys Created
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isDataLoading ? '—' : stats.totalJourneys}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Active curriculum modules</p>
          </div>
        </div>

        {/* Card 2: Total Assignments */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Assignments
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isDataLoading ? '—' : stats.totalAssignments}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Assigned to students</p>
          </div>
        </div>

        {/* Card 3: Completed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Completed Journeys
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isDataLoading ? '—' : stats.completedAssignments}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Finished all 3 stages</p>
          </div>
        </div>

        {/* Card 4: Completion Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Completion Rate
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isDataLoading ? '—' : `${stats.completionRate}%`}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Overall cohort mastery</p>
          </div>
        </div>
      </div>

      {/* Main Grid: My Journeys & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Created Journeys */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                My Learning Journeys
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Curriculum journeys created for your students
              </p>
            </div>
            <Link
              href="/teacher/journeys"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {isDataLoading ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading journeys from database...</p>
            </div>
          ) : recentJourneys.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <BookOpen size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No learning journeys created yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Create your first experiential learning journey manually or generate one with AI in seconds.
                </p>
              </div>
              <Link href="/teacher/journeys/create" className="inline-block pt-1">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl">
                  <Plus size={14} className="mr-1" />
                  <span>Create First Journey</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentJourneys.map((j) => (
                <div
                  key={j.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {j.subject} • {j.grade_level}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock size={11} />
                      <span>{j.duration_days}d</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {j.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {j.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-500 font-medium">
                      {(j.activities || []).length} activities • {j.assignment_count || 0} assigned
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/teacher/assignments?journeyId=${j.id}`}
                        className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                      >
                        Assign
                      </Link>
                      <Link
                        href={`/teacher/journeys/${j.id}`}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Recent Student Submissions */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Activity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live student completions & quiz scores
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            {isDataLoading ? (
              <div className="p-6 text-center">
                <Loader2 size={20} className="animate-spin text-indigo-600 mx-auto" />
              </div>
            ) : stats.recentSubmissions.length === 0 ? (
              <div className="p-6 text-center space-y-2 text-xs text-slate-400">
                <FileCheck size={28} className="mx-auto text-slate-300 dark:text-slate-700" />
                <p className="font-medium text-slate-600 dark:text-slate-400">No student activity yet</p>
                <p className="text-[11px] text-slate-400">
                  When students complete activities or quizzes, their scores and responses will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
                {stats.recentSubmissions.map((sub, idx) => (
                  <div key={idx} className={idx > 0 ? 'pt-3' : ''}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {sub.student_name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {sub.journey_title}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.score >= 80
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {sub.score}%
                      </span>
                    </div>
                    {sub.response && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-1 mt-1 bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-lg">
                        &ldquo;{sub.response}&rdquo;
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {new Date(sub.completed_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
