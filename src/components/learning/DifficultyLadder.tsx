'use client';

import React from 'react';
import { formatDifficultyLevel } from '@/lib/utils/terminology';
import { Sparkles, Check, X } from 'lucide-react';

interface DifficultyLadderProps {
  currentLevel: number; // 1 to 5
  levelResults?: Record<number, boolean>; // map of level number to isCorrect
  className?: string;
}

export default function DifficultyLadder({
  currentLevel = 1,
  levelResults = {},
  className = '',
}: DifficultyLadderProps) {
  const levels = [1, 2, 3, 4, 5].map((lvl) => ({
    level: lvl,
    ...formatDifficultyLevel(lvl),
  }));

  const activeLevel = formatDifficultyLevel(currentLevel);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold flex items-center gap-1.5 text-slate-900 dark:text-white">
          <Sparkles size={14} className="text-saffron-500" />
          <span>Difficulty Ladder: Level {currentLevel} ({activeLevel.name})</span>
        </span>
        <span className="text-3xs uppercase font-bold tracking-wider text-slate-400">
          {activeLevel.description}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {levels.map((lvl) => {
          const result = levelResults[lvl.level];
          const hasResult = result !== undefined;
          const isPassed = result === true;
          const isFailed = result === false;
          const isCurrent = lvl.level === currentLevel && !hasResult;

          return (
            <div
              key={lvl.level}
              className={`relative rounded-xl p-2 text-center transition-all border ${
                isPassed
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                  : isFailed
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 ring-1 ring-rose-400/40'
                  : isCurrent
                  ? 'bg-saffron-500/10 border-saffron-500 text-saffron-600 dark:text-saffron-400 ring-2 ring-saffron-500/30'
                  : lvl.level < currentLevel
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-0.5">
                {isPassed || (lvl.level < currentLevel && !hasResult) ? (
                  <Check size={12} className="stroke-3 text-emerald-600 dark:text-emerald-400" />
                ) : isFailed ? (
                  <X size={12} className="stroke-3 text-rose-600 dark:text-rose-400" />
                ) : (
                  <span className="text-3xs font-bold font-mono">L{lvl.level}</span>
                )}
              </div>
              <div className="text-3xs font-bold truncate">
                {lvl.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
