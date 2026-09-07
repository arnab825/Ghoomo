'use client';

import React from 'react';
import { formatDifficultyLevel } from '@/lib/utils/terminology';
import { Sparkles, Check, ChevronRight } from 'lucide-react';

interface DifficultyLadderProps {
  currentLevel: number; // 1 to 5
  className?: string;
}

export default function DifficultyLadder({
  currentLevel = 1,
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
          const isCompleted = lvl.level < currentLevel;
          const isCurrent = lvl.level === currentLevel;

          return (
            <div
              key={lvl.level}
              className={`relative rounded-xl p-2 text-center transition-all border ${
                isCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                  : isCurrent
                  ? 'bg-saffron-500/10 border-saffron-500 text-saffron-600 dark:text-saffron-400 ring-2 ring-saffron-500/30'
                  : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-0.5">
                {isCompleted ? (
                  <Check size={12} className="stroke-[3] text-emerald-600 dark:text-emerald-400" />
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
