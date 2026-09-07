'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Lock, Sparkles, Compass } from 'lucide-react';
import { formatLearnerState } from '@/lib/utils/terminology';

export type LearnerStatusType =
  | 'UNKNOWN'
  | 'EXPOSED'
  | 'PROVISIONALLY_READY'
  | 'DEVELOPING'
  | 'NEEDS_REVIEW'
  | 'MASTERED'
  | 'SKIPPED'
  | 'LOCKED';

interface StatusBadgeProps {
  status: LearnerStatusType | string;
  showIcon?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  MASTERED: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle2 size={12} className="shrink-0 text-emerald-600 dark:text-emerald-400" />,
  },
  NEEDS_REVIEW: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    icon: <AlertCircle size={12} className="shrink-0 text-rose-600 dark:text-rose-400" />,
  },
  DEVELOPING: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    icon: <Clock size={12} className="shrink-0 text-amber-600 dark:text-amber-400" />,
  },
  PROVISIONALLY_READY: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800',
    icon: <Sparkles size={12} className="shrink-0 text-sky-600 dark:text-sky-400" />,
  },
  EXPOSED: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: <Compass size={12} className="shrink-0 text-indigo-600 dark:text-indigo-400" />,
  },
  SKIPPED: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    icon: <CheckCircle2 size={12} className="shrink-0 text-slate-500" />,
  },
  LOCKED: {
    bg: 'bg-slate-100 dark:bg-slate-900',
    text: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-800',
    icon: <Lock size={12} className="shrink-0 text-slate-400" />,
  },
  UNKNOWN: {
    bg: 'bg-slate-50 dark:bg-slate-900',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-800',
    icon: <Clock size={12} className="shrink-0 text-slate-400" />,
  },
};

export default function StatusBadge({
  status,
  showIcon = true,
  size = 'sm',
  className = '',
}: StatusBadgeProps) {
  const normalizedStatus = (status || 'UNKNOWN').toUpperCase();
  const style = STATUS_STYLES[normalizedStatus] || STATUS_STYLES.UNKNOWN;
  const label = formatLearnerState(normalizedStatus);

  const sizeClasses = {
    xs: 'text-3xs px-2 py-0.5 gap-1',
    sm: 'text-2xs px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && style.icon}
      <span>{label}</span>
    </span>
  );
}
