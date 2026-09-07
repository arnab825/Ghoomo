'use client';

import React from 'react';
import { RefreshCw, ArrowRight, Clock, AlertCircle, PlusCircle, Check } from 'lucide-react';
import { RouteDiff as RouteDiffType } from '@/lib/types/engine';
import { Button } from '@/components/ui/button';

interface RouteDiffProps {
  diff: RouteDiffType;
  onDismiss?: () => void;
  onStartRemediation?: () => void;
}

export default function RouteDiff({ diff, onDismiss, onStartRemediation }: RouteDiffProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-300 bg-amber-50/70 dark:border-amber-900/80 dark:bg-amber-950/30 p-5 sm:p-6 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <RefreshCw size={16} className="animate-spin-once" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-amber-950 dark:text-amber-100 font-heading">
              Helpful Review Added
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Why: {diff.triggerReason}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-900 text-xs font-semibold text-amber-900 dark:text-amber-200">
          <Clock size={12} />
          <span>~{diff.netDurationChangeMinutes} min quick review</span>
        </div>
      </div>

      {/* Visual Sequence Comparison: Before vs After */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        {/* Sequence Before */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-3.5 text-xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            Previous Steps
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-slate-600 dark:text-slate-300">
            {diff.beforeSequence.slice(0, 4).map((node, i) => (
              <React.Fragment key={node.conceptId + i}>
                <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                  {node.conceptName}
                </span>
                {i < Math.min(diff.beforeSequence.length - 1, 3) && (
                  <ArrowRight size={12} className="text-slate-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Sequence After (With Inserted Remediation Node) */}
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-100/50 dark:bg-amber-900/30 p-3.5 text-xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-2">
            Updated Steps (With Review)
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {diff.afterSequence.slice(0, 5).map((node, i) => (
              <React.Fragment key={node.conceptId + i}>
                <span
                  className={`px-2 py-1 rounded-md font-medium inline-flex items-center gap-1 ${
                    node.isInserted
                      ? 'bg-amber-500 text-white font-semibold shadow-2xs'
                      : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {node.isInserted && <PlusCircle size={10} />}
                  {node.conceptName}
                </span>
                {i < Math.min(diff.afterSequence.length - 1, 4) && (
                  <ArrowRight size={12} className="text-amber-600 dark:text-amber-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Action & Next Best Move */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-xs text-amber-900 dark:text-amber-200">
          <span className="font-semibold">Recommended Next Step: </span>
          <span className="underline decoration-amber-400 font-medium">{diff.nextActionTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          {onDismiss && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              className="text-xs border-amber-300 dark:border-amber-800 rounded-xl"
            >
              Got it
            </Button>
          )}
          {onStartRemediation && (
            <Button
              size="sm"
              onClick={onStartRemediation}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl"
            >
              <span>Start Quick Review</span>
              <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
