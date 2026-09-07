'use client';

import React from 'react';
import { RouteEvent } from '@/lib/types/engine';
import { Compass, RefreshCw, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface DecisionTrailProps {
  events: RouteEvent[];
}

export default function DecisionTrail({ events }: DecisionTrailProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-xs">
        <Compass className="mx-auto h-8 w-8 text-slate-400 mb-2" />
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Your Learning Milestones
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
          As you practice, answer quizzes, and unlock new topics, your learning achievements will appear here.
        </p>
      </div>
    );
  }

  function getEventIcon(type: string) {
    switch (type) {
      case 'MISCONCEPTION_REROUTE':
        return <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" />;
      case 'DIAGNOSTIC_SKIPPED':
        return <Sparkles size={14} className="text-sky-600 dark:text-sky-400" />;
      case 'MASTERY_UNLOCKED':
        return <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />;
      default:
        return <RefreshCw size={14} className="text-indigo-600 dark:text-indigo-400" />;
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
          Recent Achievements & Updates
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          A clear history of your steps, unlocked topics, and review sessions.
        </p>
      </div>

      <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 space-y-4 py-1">
        {events.map((event) => (
          <div key={event.id} className="relative pl-6">
            {/* Timeline node icon */}
            <div className="absolute -left-2.5 top-1 h-5 w-5 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
              {getEventIcon(event.eventType)}
            </div>

            <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {event.reason}
                </span>
                <span className="text-2xs font-mono text-slate-400">
                  {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {event.evidenceSummary && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 italic">
                  Note: {event.evidenceSummary}
                </p>
              )}

              {event.previousAction && event.newAction && (
                <div className="flex items-center gap-2 pt-1 text-2xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span>Earlier: {event.previousAction}</span>
                  <ArrowRight size={10} className="text-indigo-500" />
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Next: {event.newAction}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
