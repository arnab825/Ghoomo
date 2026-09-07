'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Loader2,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/shared/EmptyState';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase/client';

interface ArchivedGoal {
  id: string;
  title: string;
  targetDomain: string;
  dailyMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export default function ArchivePage() {
  const { user } = useAuthStore();
  const [archivedGoals, setArchivedGoals] = useState<ArchivedGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [goalToDelete, setGoalToDelete] = useState<ArchivedGoal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadArchived = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['abandoned', 'archived'])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setArchivedGoals(
        (data || []).map((g) => ({
          id: g.id,
          title: g.title,
          targetDomain: g.target_domain,
          dailyMinutes: g.daily_minutes,
          createdAt: g.created_at,
          updatedAt: g.updated_at,
        }))
      );
    } catch (err) {
      console.error('Failed to load archived courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArchived();
  }, [user]);

  const handleRestore = async (goalId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('learning_goals')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('user_id', user!.id);

      if (error) throw error;

      setActionSuccess(`"${title}" has been restored to your active courses.`);
      setArchivedGoals((prev) => prev.filter((g) => g.id !== goalId));
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to restore goal:', err);
    }
  };

  const handlePermanentDelete = async () => {
    if (!goalToDelete || !user) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('learning_goals')
        .delete()
        .eq('id', goalToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setActionSuccess(`"${goalToDelete.title}" was permanently deleted.`);
      setArchivedGoals((prev) => prev.filter((g) => g.id !== goalToDelete.id));
      setGoalToDelete(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to permanently delete goal:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">
          Loading your archived courses...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/app/goals"
              className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
            >
              <ArrowLeft size={13} />
              <span>Back to My Courses</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Archived Courses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Courses you have archived to declutter your active dashboard. You can restore them anytime or delete them permanently.
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* List or Empty State */}
      {archivedGoals.length === 0 ? (
        <EmptyState
          icon={<Archive size={28} />}
          title="Archive is Empty"
          description="You don't have any archived courses. When you archive a course from your dashboard or courses page, it will appear here."
          actionLabel="View Active Courses"
          onAction={() => (window.location.href = '/app/goals')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archivedGoals.map((g) => (
            <div
              key={g.id}
              className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                    {g.targetDomain}
                  </span>
                  <span className="text-2xs font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Archived
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  {g.title}
                </h3>

                <div className="flex items-center gap-3 text-2xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {g.dailyMinutes} min/day
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {g.updatedAt ? new Date(g.updatedAt).toLocaleDateString() : 'Archived'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <Button
                  onClick={() => handleRestore(g.id, g.title)}
                  size="sm"
                  variant="outline"
                  className="text-xs font-semibold h-8 px-3 rounded-xl hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-800 flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Restore</span>
                </Button>

                <Button
                  onClick={() => setGoalToDelete(g)}
                  size="sm"
                  variant="ghost"
                  className="text-xs font-semibold h-8 px-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Permanent Delete */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setGoalToDelete(null)}
          />

          <div className="relative w-full max-w-md rounded-3xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                Permanently Delete Course?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete <strong>"{goalToDelete.title}"</strong>? This will permanently remove all associated progress and practice records. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setGoalToDelete(null)}
                className="text-xs h-9 px-4 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isDeleting}
                onClick={handlePermanentDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Yes, Permanently Delete</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
