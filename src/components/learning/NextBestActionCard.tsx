'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Clock, ArrowRight, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { NextBestAction } from '@/lib/types/engine';
import { Button } from '@/components/ui/button';

interface NextBestActionCardProps {
  action: NextBestAction | null;
  isLoading?: boolean;
}

export default function NextBestActionCard({ action, isLoading }: NextBestActionCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md mb-4" />
        <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md mb-6" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded-md" />
          <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
        </div>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs text-center">
        <Compass className="mx-auto h-12 w-12 text-slate-400 mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
          No Active Goal Yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
          Choose a goal or create your first learning path to see your recommended next step.
        </p>
      </div>
    );
  }

  const isRemediation = action.activityType === 'REMEDIATE';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 shadow-xs ${
        isRemediation
          ? 'border-amber-300 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20'
          : 'border-indigo-200 bg-white dark:border-indigo-950 dark:bg-slate-900'
      }`}
    >
      {/* Top Accent Ribbon */}
      <div
        className={`h-1.5 w-full ${
          isRemediation
            ? 'bg-linear-to-r from-amber-500 to-orange-500'
            : 'bg-linear-to-r from-indigo-600 via-blue-600 to-emerald-600'
        }`}
      />

      <div className="p-6 sm:p-8 space-y-6">
        {/* Header Pill & Timing */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase border">
            {isRemediation ? (
              <>
                <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" />
                <span className="text-amber-800 dark:text-amber-300">Quick Review & Practice</span>
              </>
            ) : (
              <>
                <Compass size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-indigo-800 dark:text-indigo-300">Recommended Next Step</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Clock size={14} />
            <span>~{action.estimatedMinutes} minutes</span>
          </div>
        </div>

        {/* Action Title & Concept */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white font-heading">
            {action.activityTitle}
          </h2>
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1">
            Topic: {action.conceptName}
          </p>
        </div>

        {/* The 4 Decision Factors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Factor 1: Why this? */}
          <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>WHAT YOU WILL GAIN</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {action.whyThis}
            </p>
          </div>

          {/* Factor 2: Why now? */}
          <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <Clock size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>WHY NOW</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {action.whyNow}
            </p>
          </div>

          {/* Factor 3: Why not another concept? */}
          <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <HelpCircle size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>WHY THIS FIRST</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {action.whyNotAnother}
            </p>
          </div>

          {/* Factor 4: Evidence basis */}
          <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>HOW THIS HELPS YOU</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {action.evidenceFactors}
            </p>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="pt-2 flex items-center justify-between">
          <Link href={`/app/learn/${action.activityId}`} className="w-full sm:w-auto">
            <Button
              size="lg"
              className={`w-full sm:w-auto font-semibold rounded-xl ${
                isRemediation
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <span>{isRemediation ? 'Start Quick Review' : 'Continue Lesson'}</span>
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
