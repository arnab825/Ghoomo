'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles, MapPin, Compass, CheckCircle2 } from 'lucide-react';
import { AITier } from '@/lib/types/ghoomo';

interface ProgressiveLoadingProps {
  isLoading: boolean;
  onComplete?: () => void;
  tierHint?: AITier;
}

const STAGES = [
  { minMs: 0, maxMs: 2000, message: 'Reading your Reel...', icon: Sparkles, color: 'text-teal-600' },
  { minMs: 2000, maxMs: 4000, message: 'Finding places...', icon: MapPin, color: 'text-orange-500' },
  { minMs: 4000, maxMs: 7000, message: 'Building your trip plan...', icon: Compass, color: 'text-teal-600' },
  { minMs: 7000, maxMs: 12000, message: 'Optimizing route...', icon: CheckCircle2, color: 'text-emerald-600' },
];

export default function ProgressiveLoading({ isLoading, tierHint }: ProgressiveLoadingProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setElapsedMs(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedMs((prev) => prev + 200);
    }, 200);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  // Determine active stage
  const currentStage = STAGES.find((s) => elapsedMs >= s.minMs && elapsedMs < s.maxMs) || STAGES[STAGES.length - 1];
  const Icon = currentStage.icon;
  const progressPercent = Math.min(95, Math.round((elapsedMs / 8000) * 100));

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-900/70 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
            <Icon size={16} className="animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white transition-all">
              {currentStage.message}
            </div>
            <div className="text-[10px] text-slate-500">
              {elapsedMs < 2000
                ? 'Extracting creator coordinates'
                : elapsedMs < 4000
                ? 'Matching against 58 India reference landmarks'
                : elapsedMs < 7000
                ? 'Clustering into morning, afternoon & evening'
                : 'Validating travel time < 2 hours'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Loader2 size={10} className="animate-spin" />
          <span>{(elapsedMs / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden dark:bg-slate-800">
        <div
          className="h-full bg-linear-to-r from-teal-600 via-teal-500 to-orange-500 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3-Tier Badge Indicator */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-ping" />
          <span>3-Tier Fallback Active</span>
        </span>
        <span className="font-mono text-slate-600 dark:text-slate-400">
          {elapsedMs < 5000 ? 'Tier 1: Gemini 1.5 Flash' : elapsedMs < 8000 ? 'Tier 2: Groq Llama 3.1 70B' : 'Tier 3: Rule Clustering'}
        </span>
      </div>
    </div>
  );
}
