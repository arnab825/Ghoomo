'use client';

import * as React from 'react';
import { AlertCircle, FolderOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StateViewProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  errorMessage?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRetry?: () => void;
  loadingMessage?: string;
  children: React.ReactNode;
}

export function StateView({
  isLoading,
  isError,
  isEmpty,
  errorMessage = 'An error occurred while loading this data.',
  emptyTitle = 'No records found',
  emptyMessage = 'There is currently no data matching your criteria.',
  emptyActionLabel,
  onEmptyAction,
  onRetry,
  loadingMessage = 'Loading trusted travel data...',
  children,
}: StateViewProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-slate-200 bg-white min-h-55 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent mb-3" />
        <p className="text-sm text-slate-600 font-medium dark:text-slate-400">{loadingMessage}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-red-200 bg-red-50 min-h-50 dark:border-rose-500/30 dark:bg-rose-950/20">
        <AlertCircle className="h-10 w-10 text-red-600 mb-3 dark:text-rose-400" />
        <h4 className="text-base font-semibold text-red-900 mb-1 dark:text-rose-200">Unable to Load Data</h4>
        <p className="text-sm text-red-700 max-w-md mb-4 dark:text-rose-300/80">{errorMessage}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="border-red-300 text-red-700 hover:bg-red-100 dark:border-rose-700/50 dark:text-rose-200">
            <RefreshCw size={14} className="mr-1.5" /> Retry
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50 min-h-55 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3 dark:bg-slate-800/80 dark:text-slate-400">
          <FolderOpen size={22} />
        </div>
        <h4 className="text-base font-semibold text-slate-900 mb-1 dark:text-slate-200">{emptyTitle}</h4>
        <p className="text-sm text-slate-600 max-w-sm mb-4 dark:text-slate-400">{emptyMessage}</p>
        {emptyActionLabel && onEmptyAction && (
          <Button variant="default" size="sm" onClick={onEmptyAction}>
            {emptyActionLabel}
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
