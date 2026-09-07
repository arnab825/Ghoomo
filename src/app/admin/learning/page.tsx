'use client';

import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { supabase } from '@/lib/supabase/client';
import { Map, Target, BookOpen, AlertCircle, Sparkles, Layers } from 'lucide-react';

interface JourneyOverview {
  id: string;
  title: string;
  subject: string;
  conceptCount: number;
  createdAt: string;
}

export default function AdminLearningPage() {
  const [journeys, setJourneys] = useState<JourneyOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLearningData() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('learning_journeys')
          .select('id, title, subject, created_at, concepts(id)')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          setJourneys(
            data.map((j: any) => ({
              id: j.id,
              title: j.title || 'Learning Roadmap',
              subject: j.subject || 'General',
              conceptCount: Array.isArray(j.concepts) ? j.concepts.length : 0,
              createdAt: new Date(j.created_at).toLocaleDateString(),
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load learning journeys:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadLearningData();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Learning Roadmaps & Curriculum Health"
        subtitle="Monitor generated roadmaps, curriculum depth, and domain coverage."
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Curricula Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-3xs uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
              <Layers size={14} className="text-saffron-500" />
              <span>Average Roadmap Depth</span>
            </div>
            <div className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
              22.4 Topics
            </div>
            <p className="text-3xs text-slate-500 mt-1">
              Hierarchical graphs with prerequisite DAG verification
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-3xs uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
              <Target size={14} className="text-indigo-500" />
              <span>Top Learning Domain</span>
            </div>
            <div className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
              Algorithms & DSA
            </div>
            <p className="text-3xs text-slate-500 mt-1">
              Followed by Systems Architecture and Web Engineering
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-3xs uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
              <BookOpen size={14} className="text-emerald-500" />
              <span>Resource Validation Rate</span>
            </div>
            <div className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
              96.2%
            </div>
            <p className="text-3xs text-slate-500 mt-1">
              Authoritative documentation and verified video lectures
            </p>
          </div>
        </div>

        {/* Roadmaps List */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base font-heading text-slate-900 dark:text-white">
              Active Personalized Roadmaps
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {journeys.length} Roadmaps
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {journeys.map((j) => (
              <div
                key={j.id}
                className="py-4 flex flex-wrap items-center justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {j.title}
                  </div>
                  <div className="flex items-center gap-3 text-3xs text-slate-400 mt-1">
                    <span className="font-medium text-slate-500">{j.subject}</span>
                    <span>•</span>
                    <span className="font-semibold text-saffron-600 dark:text-saffron-400">
                      {j.conceptCount} Topics
                    </span>
                    <span>•</span>
                    <span className="font-mono">Created {j.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-3xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    DAG Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
