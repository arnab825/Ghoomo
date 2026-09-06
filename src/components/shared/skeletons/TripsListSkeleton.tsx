'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TripsListSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-8 animate-in fade-in duration-150">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Grid of Trip Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs space-y-4 p-4 dark:border-slate-800 dark:bg-slate-900/60"
          >
            {/* Cover Image Skeleton */}
            <Skeleton className="h-44 w-full rounded-md" />

            {/* Title & Info */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-4/5 rounded-md" />
              <Skeleton className="h-3 w-3/5 rounded-md" />
            </div>

            {/* Badges & Meta */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-14 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
