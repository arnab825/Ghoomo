'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  Sparkles,
  ArrowLeft,
  BookOpen,
  Calendar,
  Award,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';

interface StudentReflectionItem {
  id: string;
  prompt: string;
  response: string;
  ai_feedback?: string;
  rubric_depth: number;
  rubric_accuracy: number;
  rubric_synthesis: number;
  created_at: string;
  learning_journeys?: {
    title: string;
    subject: string;
    grade_level: string;
  };
}

export default function StudentReflectionsPage() {
  const { user, isLoading: authLoading, isAuthorized } = useAuthGuard({ requiredRole: 'student' });
  const [reflections, setReflections] = useState<StudentReflectionItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function load() {
      setIsDataLoading(true);
      try {
        const { data, error } = await supabase
          .from('reflections')
          .select(`
            id,
            prompt,
            response,
            ai_feedback,
            rubric_depth,
            rubric_accuracy,
            rubric_synthesis,
            created_at,
            learning_journeys (title, subject, grade_level)
          `)
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false });

        if (!error && data && isMounted) {
          setReflections(data as any);
        }
      } catch (err) {
        console.error('Error fetching reflections:', err);
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
        <p className="text-xs font-semibold text-slate-500">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/60 mb-2">
            <span>Critical Thinking Portfolio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            My Learning Reflections
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your personal field reflections evaluated with 3D AI rubrics.
          </p>
        </div>

        <Link href="/student/dashboard">
          <Button variant="outline" className="text-xs font-semibold py-2 px-3.5 rounded-xl">
            <ArrowLeft size={14} className="mr-1.5" />
            <span>Dashboard</span>
          </Button>
        </Link>
      </div>

      {isDataLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading reflection portfolio...</p>
        </div>
      ) : reflections.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <Sparkles size={28} className="mx-auto text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No reflections submitted yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you complete the After stage in your assigned learning journeys and submit reflections, your AI evaluations will be archived here.
          </p>
          <Link href="/student/journeys" className="inline-block pt-1">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl">
              Go to My Journeys
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {reflections.map((ref) => (
            <div
              key={ref.id}
              className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {ref.learning_journeys?.title || 'Learning Journey'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {ref.learning_journeys?.subject} • {ref.learning_journeys?.grade_level}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{new Date(ref.created_at).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                    Reflection Prompt:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 italic">{ref.prompt}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 text-xs space-y-1">
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Your Response:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{ref.response}</p>
                </div>
              </div>

              {ref.ai_feedback && (
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      <span>Gemini AI Evaluation</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      Depth: {ref.rubric_depth}/5 • Accuracy: {ref.rubric_accuracy}/5 • Synthesis: {ref.rubric_synthesis}/5
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    &ldquo;{ref.ai_feedback}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
