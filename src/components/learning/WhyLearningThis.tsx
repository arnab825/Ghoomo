'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Target, Network, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface WhyLearningThisProps {
  goalTitle: string;
  conceptName: string;
  requiredForNames: string[];
  demonstratedPrereqs: string[];
  currentGapDescription?: string;
  synthesisNote?: string;
}

export default function WhyLearningThis({
  goalTitle,
  conceptName,
  requiredForNames,
  demonstratedPrereqs,
  currentGapDescription,
  synthesisNote,
}: WhyLearningThisProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-2xs overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5">
          <Target size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
            Why Am I Learning This?
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            ({conceptName})
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          <span>{isExpanded ? 'Less' : 'Learn Why'}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm space-y-4">
          {/* Target Goal Relationship */}
          <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
            <Target size={15} className="text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Your Goal: </span>
              <span>{goalTitle}</span>
            </div>
          </div>

          {/* Prerequisite & Downstream Chain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Known Foundations */}
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                What you already know (✓)
              </span>
              {demonstratedPrereqs.length > 0 ? (
                <ul className="space-y-1">
                  {demonstratedPrereqs.map((prereq, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                      <CheckCircle size={12} className="shrink-0" />
                      <span>{prereq}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-slate-500">First foundational topic</span>
              )}
            </div>

            {/* Unlocks Downstream */}
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                What this unlocks next (→)
              </span>
              {requiredForNames.length > 0 ? (
                <ul className="space-y-1">
                  {requiredForNames.map((req, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300">
                      <ArrowRight size={12} className="shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-slate-500">Final goal milestone</span>
              )}
            </div>
          </div>

          {/* Identified Gap Warning if any */}
          {currentGapDescription && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Current Focus Area: </span>
                <span>{currentGapDescription}</span>
              </div>
            </div>
          )}

          {/* Synthesis */}
          <p className="text-xs text-slate-600 dark:text-slate-400 italic pt-1">
            {synthesisNote || `Mastering ${conceptName} bridges your foundation and activates your next milestone.`}
          </p>
        </div>
      )}
    </div>
  );
}
