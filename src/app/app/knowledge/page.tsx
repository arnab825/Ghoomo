'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useLearningMapQuery } from '@/hooks/queries/useLearningMapQuery';
import KnowledgeGraphMap from '@/components/learning/KnowledgeGraphMap';
import { Loader2, Compass, CheckCircle2, Clock, AlertCircle, Archive, ChevronDown } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

export default function LearningMapPage() {
  const { user } = useAuthStore();
  const { setGoalWizardOpen } = useUIStore();
  const [selectedGoalId, setSelectedGoalId] = useState<string>('ALL');
  const queryClient = useQueryClient();

  // TanStack Query cached data with keepPreviousData — zero refresh or redraw on tab switch
  const { data, isLoading, refetch } = useLearningMapQuery(user?.id, selectedGoalId);

  // Auto-refresh when a roadmap is created, updated or restored
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['learning-map'] });
      refetch();
    };
    window.addEventListener('ghoomo:roadmap-updated', handleUpdate);
    return () => window.removeEventListener('ghoomo:roadmap-updated', handleUpdate);
  }, [refetch, queryClient]);

  const activeGoals = data?.activeGoals || [];
  const archivedCount = data?.archivedCount || 0;
  const concepts = data?.concepts || [];
  const prerequisites = data?.prerequisites || [];
  const states = data?.states || new Map();
  const activities = data?.activities || [];

  if (isLoading && concepts.length === 0) {
    return (
      <div className="min-h-55 flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-saffron-500" />
        <p className="text-xs font-semibold text-slate-500">
          Loading your learning map...
        </p>
      </div>
    );
  }

  // If no active roadmaps or concepts exist
  if (activeGoals.length === 0 || concepts.length === 0) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <EmptyState
          icon={<Compass size={32} className="text-saffron-500" />}
          title={archivedCount > 0 ? "All Courses Are Archived" : "No Active Learning Map Yet"}
          description={
            archivedCount > 0
              ? "All of your roadmaps are currently in the archive. Restore a course from your archive or create a new roadmap to explore its connected concepts."
              : "Create your first learning roadmap to explore an interactive visual graph of connected topics tailored to your background."
          }
          actionLabel="Create Learning Goal"
          onAction={() => setGoalWizardOpen(true)}
        />
        {archivedCount > 0 && (
          <div className="mt-4 flex justify-center">
            <Link href="/app/archive">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:border-saffron-500"
              >
                <Archive size={13} />
                <span>Go to Archived Courses ({archivedCount})</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Quick stats calculation
  let masteredCount = 0;
  let inProgressCount = 0;
  let reviewCount = 0;

  concepts.forEach((c) => {
    const s = states.get(c.id)?.state;
    if (s === 'MASTERED') masteredCount++;
    else if (s === 'NEEDS_REVIEW') reviewCount++;
    else if (s === 'DEVELOPING' || s === 'PROVISIONALLY_READY') inProgressCount++;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 min-w-0 w-full overflow-x-hidden">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Your Learning Map
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explore your connected roadmap. Zoom, pan, and inspect topics to learn, practice, and master.
          </p>
        </div>

        {/* Roadmap Selector & Stats */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Roadmap Selector if more than 1 active goal exists */}
          {activeGoals.length > 1 && (
            <div className="relative inline-block">
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-saffron-500 cursor-pointer appearance-none"
              >
                <option value="ALL">All Active Roadmaps ({activeGoals.length})</option>
                {activeGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
              />
            </div>
          )}

          {/* Quick link to archive if user has archived courses */}
          {archivedCount > 0 && (
            <Link href="/app/archive">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold h-8 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1.5"
              >
                <Archive size={13} />
                <span>Archive ({archivedCount})</span>
              </Button>
            </Link>
          )}

          {/* Quick pill stats */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={14} />
            <span>{masteredCount} Mastered</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Clock size={14} />
            <span>{inProgressCount} In Progress</span>
          </div>
          {reviewCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-400 animate-pulse">
              <AlertCircle size={14} />
              <span>{reviewCount} To Review</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive SVG Learning Map */}
      <KnowledgeGraphMap
        concepts={concepts}
        prerequisites={prerequisites}
        learnerStates={states}
        activities={activities}
        roadmapTitle={
          (selectedGoalId === 'ALL' ? activeGoals[0]?.title : activeGoals.find((g) => g.id === selectedGoalId)?.title) || 'Interactive Learning Roadmap'
        }
        roadmapSubject={
          (selectedGoalId === 'ALL' ? activeGoals[0]?.targetDomain : activeGoals.find((g) => g.id === selectedGoalId)?.targetDomain) || 'Computer Science'
        }
      />
    </div>
  );
}
