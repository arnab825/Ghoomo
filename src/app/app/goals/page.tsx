'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { supabase } from '@/lib/supabase/client';
import { LearningGoal } from '@/lib/types/engine';
import {
  Target,
  Plus,
  Calendar,
  Clock,
  Archive,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/shared/EmptyState';

export default function GoalsPage() {
  const { user } = useAuthStore();
  const { setGoalWizardOpen } = useUIStore();
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadGoals = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'abandoned')
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGoals(
        (data || []).map((g) => ({
          id: g.id,
          userId: g.user_id,
          title: g.title,
          targetDomain: g.target_domain,
          targetDate: g.target_date,
          dailyMinutes: g.daily_minutes,
          status: g.status,
          createdAt: g.created_at,
        }))
      );
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [user]);

  const handleArchive = async (goalId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('learning_goals')
        .update({ status: 'abandoned', updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('user_id', user!.id);

      if (error) {
        console.error('Failed to archive course details:', error.message, error.details);
        throw error;
      }

      setActionSuccess(`"${title}" has been moved to your Archive.`);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to archive course:', err?.message || err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">
          Loading your courses...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            My Courses & Goals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Active topics and skills you are pursuing. Archive any course when finished or taking a break.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/app/archive">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold h-9 px-3.5 rounded-xl flex items-center gap-1.5"
            >
              <Archive size={14} />
              <span>View Archive</span>
            </Button>
          </Link>

          <Button
            onClick={() => setGoalWizardOpen(true)}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Create Course</span>
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target size={28} />}
          title="No Active Courses"
          description="Tell us what you want to learn, and we'll create a step-by-step roadmap tailored specifically to your background."
          actionLabel="Create Your First Course"
          onAction={() => setGoalWizardOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => (
            <div
              key={g.id}
              className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {g.targetDomain}
                  </span>
                  <span className="text-2xs font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                    Active
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  {g.title}
                </h3>

                <div className="flex items-center gap-3 text-2xs text-slate-400 pt-1">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{g.dailyMinutes} min/day</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>
                      {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <Link href={`/app/course/${g.id}`} className="flex-1">
                  <Button
                    size="sm"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Continue</span>
                    <ArrowRight size={13} />
                  </Button>
                </Link>

                <Button
                  onClick={() => handleArchive(g.id, g.title)}
                  size="sm"
                  variant="outline"
                  title="Archive course"
                  className="text-xs font-semibold h-8 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:border-slate-300"
                >
                  <Archive size={13} />
                  <span>Archive</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
