'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TripWorkspaceSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-72px)] bg-[#fafafa] dark:bg-slate-950 animate-in fade-in duration-150">
      {/* 1. Header Bar Skeleton */}
      <header className="border-b border-slate-200 bg-white/90 px-4 sm:px-6 py-3 sticky top-16 z-30 dark:border-slate-800 dark:bg-slate-950/80 shadow-xs">
        <div className="container mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-56 sm:w-72 rounded-md" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-44 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-36 rounded-md" />
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Column: 5 Cols */}
        <div className="lg:col-span-5 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/50 p-4 sm:p-5 space-y-4">
          {/* Tabs Navigation Skeleton */}
          <div className="flex p-1 rounded-md bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 gap-1">
            <Skeleton className="flex-1 h-7 rounded-md" />
            <Skeleton className="flex-1 h-7 rounded-md" />
            <Skeleton className="flex-1 h-7 rounded-md" />
          </div>

          {/* Quick Day Filter Chips */}
          <div className="flex items-center gap-1.5 py-1">
            <Skeleton className="h-7 w-12 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>

          {/* Day Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2].map((d) => (
              <div
                key={d}
                className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3 dark:border-slate-800 dark:bg-slate-900/60 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-md" />
                    <Skeleton className="h-4 w-36 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-12 rounded-md" />
                </div>

                {/* Place Items in Day */}
                <div className="space-y-2 pt-1">
                  {[1, 2].map((p) => (
                    <div
                      key={p}
                      className="flex items-center gap-3 p-2 rounded-md border border-slate-100 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-950/40"
                    >
                      <Skeleton className="h-14 w-14 rounded-md shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-32 rounded-md" />
                          <Skeleton className="h-3 w-16 rounded-md" />
                        </div>
                        <Skeleton className="h-3 w-44 rounded-md" />
                        <Skeleton className="h-3 w-24 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: 7 Cols Map Skeleton */}
        <div className="lg:col-span-7 h-125 lg:h-full relative p-4 flex flex-col">
          <div className="flex-1 rounded-lg overflow-hidden shadow-xs border border-slate-200 bg-slate-100 relative dark:border-slate-800 dark:bg-slate-900/80 flex items-center justify-center">
            {/* Gentle Radar Glow Animation */}
            <div className="absolute inset-0 bg-linear-to-tr from-teal-500/5 via-transparent to-orange-500/5" />
            <div className="relative flex flex-col items-center gap-3 text-center p-6">
              <div className="h-12 w-12 rounded-full border-2 border-teal-600/40 border-t-teal-600 animate-spin" />
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Loading Interactive Map & Route Clusters...
                </div>
                <div className="text-[11px] text-slate-400">
                  Connecting coordinates with CartoDB Matter tiles
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
