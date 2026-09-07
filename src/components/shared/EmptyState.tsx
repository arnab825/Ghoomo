'use client';

import React from 'react';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5">
        {icon || <Compass size={28} />}
      </div>

      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white font-heading">
        {title}
      </h3>

      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2 mb-6 max-w-md mx-auto">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outline" size="lg">
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
