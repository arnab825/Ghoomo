'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers,
  HelpCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getJourneyWithDetails,
  deleteJourneyInDb,
  DbLearningJourney,
} from '@/lib/services/journeyDbService';

export default function TeacherJourneyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const journeyId = params.id as string;

  const { user, isLoading: authLoading, isAuthorized } = useAuthGuard({ requiredRole: 'teacher' });
  const [journey, setJourney] = useState<DbLearningJourney | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!journeyId) return;
    let isMounted = true;

    async function load() {
      setIsDataLoading(true);
      try {
        const data = await getJourneyWithDetails(journeyId);
        if (isMounted) setJourney(data);
      } catch (err) {
        console.error('Failed to load journey:', err);
      } finally {
        if (isMounted) setIsDataLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [journeyId]);

  const handleDelete = async () => {
    if (!user || !journey) return;
    if (!window.confirm('Are you sure you want to delete this journey?')) return;

    const ok = await deleteJourneyInDb(user.id, journey.id);
    if (ok) {
      router.push('/teacher/journeys');
    } else {
      alert('Could not delete journey.');
    }
  };

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-semibold text-slate-500">Checking permissions...</p>
      </div>
    );
  }

  if (isDataLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16 text-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
        <p className="text-xs text-slate-500">Loading journey details from database...</p>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Journey Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested journey could not be located in your curriculum library.
        </p>
        <Link href="/teacher/journeys">
          <Button size="sm" variant="outline" className="text-xs rounded-xl">
            Return to My Journeys
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/teacher/journeys"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to My Journeys</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/teacher/assignments?journeyId=${journey.id}`}>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
            >
              <Users size={14} />
              <span>Assign to Students</span>
            </Button>
          </Link>

          <button
            onClick={handleDelete}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
            title="Delete journey"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
            {journey.subject}
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {journey.grade_level}
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">
            {journey.difficulty}
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">
            Mode: {journey.mode}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
          {journey.title}
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          {journey.description}
        </p>

        <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-slate-400" />
            <span>Duration: {journey.duration_days} Day{journey.duration_days > 1 ? 's' : ''}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400" />
            <span>Created: {new Date(journey.created_at).toLocaleDateString()}</span>
          </span>
        </div>
      </div>

      {/* Objectives */}
      <div className="p-6 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          Learning Objectives
        </h3>
        <div className="space-y-2.5">
          {(journey.objectives || []).map((obj, idx) => (
            <div
              key={obj.id || idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
            >
              <span className="h-6 w-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {obj.objective}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mt-1 block">
                  Bloom&apos;s Level: {obj.blooms_level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3-Stage Activities Pipeline */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          3-Stage Learning Pipeline (Before → During → After)
        </h3>

        <div className="space-y-3">
          {(journey.activities || []).map((act, idx) => (
            <div
              key={act.id || idx}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    Stage: {act.stage}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                    {act.type}
                  </span>
                  {act.place_name && (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                      <MapPin size={10} />
                      <span>{act.place_name}</span>
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">{act.duration_minutes} mins</span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {idx + 1}. {act.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  {act.description}
                </p>
              </div>

              {act.instruction && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">Instruction:</span> {act.instruction}
                </div>
              )}

              {act.thinking_prompt && (
                <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100/60 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200">
                  <span className="font-semibold">Inquiry Prompt:</span> {act.thinking_prompt}
                </div>
              )}

              {/* Questions */}
              {act.questions && act.questions.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Formative Checkpoint Questions ({act.questions.length})
                  </span>
                  <div className="space-y-2">
                    {act.questions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1"
                      >
                        <p className="font-semibold text-slate-900 dark:text-white">
                          Q{qIdx + 1}: {q.question}
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                          Correct: {q.correct_answer}
                        </p>
                        {q.explanation && (
                          <p className="text-slate-400 text-[11px]">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
