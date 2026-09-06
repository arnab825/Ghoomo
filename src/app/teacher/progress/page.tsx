'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getTeacherAssignments,
  getTeacherJourneys,
  DbAssignment,
  DbLearningJourney,
} from '@/lib/services/journeyDbService';

export default function TeacherProgressPage() {
  const { user, isLoading: authLoading, isAuthorized } = useAuthGuard({ requiredRole: 'teacher' });

  const [assignments, setAssignments] = useState<DbAssignment[]>([]);
  const [journeys, setJourneys] = useState<DbLearningJourney[]>([]);
  const [selectedJourneyFilter, setSelectedJourneyFilter] = useState('all');
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAuthorized || authLoading) return;
    let isMounted = true;

    async function load() {
      setIsDataLoading(true);
      try {
        const [teacherAssignments, teacherJourneys] = await Promise.all([
          getTeacherAssignments(user!.id),
          getTeacherJourneys(user!.id),
        ]);

        if (isMounted) {
          setAssignments(teacherAssignments);
          setJourneys(teacherJourneys);
        }
      } catch (err) {
        console.error('Failed to load progress data:', err);
      } finally {
        if (isMounted) setIsDataLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [user, isAuthorized, authLoading]);

  const filtered = assignments.filter((a) => {
    if (selectedJourneyFilter === 'all') return true;
    return a.journey_id === selectedJourneyFilter;
  });

  const totalAssigned = filtered.length;
  const completedCount = filtered.filter((a) => a.status === 'completed').length;
  const inProgressCount = filtered.filter((a) => a.status === 'in_progress').length;
  const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-semibold text-slate-500">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 mb-2">
            <span>Learning Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Student Progress & Mastery
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor activity completion, quiz performance, and reflections across all your cohorts.
          </p>
        </div>

        <Link href="/teacher/dashboard">
          <Button variant="outline" className="text-xs font-semibold py-2 px-3.5 rounded-xl">
            <ArrowLeft size={14} className="mr-1.5" />
            <span>Teacher Dashboard</span>
          </Button>
        </Link>
      </div>

      {/* Cohort Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Total Enrolled</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalAssigned}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">In Progress</span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Completed All Stages</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Cohort Completion Rate</span>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{completionRate}%</div>
        </div>
      </div>

      {/* Filter by Journey */}
      {journeys.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Filter by Journey:
          </span>
          <select
            value={selectedJourneyFilter}
            onChange={(e) => setSelectedJourneyFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
          >
            <option value="all">All Journeys ({journeys.length})</option>
            {journeys.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Progress Table */}
      {isDataLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading progress from database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <Users size={28} className="mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No active student data</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Assign journeys to students to start tracking their progress in real time.
          </p>
          <Link href="/teacher/assignments" className="inline-block pt-2">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl">
              Assign Journey
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Journey Module</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Assigned Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                          {item.student?.full_name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {item.student?.full_name || 'Student'}
                          </span>
                          <span className="text-[11px] text-slate-400">{item.student?.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {item.journey?.title}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.journey?.subject} • {item.journey?.grade_level}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : item.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
