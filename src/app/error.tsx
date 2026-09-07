'use client';

import * as React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { formatSafeUserError } from '@/lib/utils/errorHandler';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[RootError] Unhandled application error:', error);
  }, [error]);

  const safeMessage = formatSafeUserError(
    error,
    'A temporary glitch prevented this screen from displaying. Please click retry below.'
  );

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center p-6 bg-[#fafafa] dark:bg-slate-950">
      <div className="max-w-md w-full p-8 rounded-lg border border-red-200 bg-white dark:border-rose-900/50 dark:bg-slate-900 shadow-md text-center space-y-4">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-rose-950/50 dark:text-rose-400">
          <AlertCircle size={28} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
            Application Glitch Detected
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            {safeMessage}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white text-xs px-4 py-2 rounded-md shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw size={13} className="mr-1.5" />
            <span>Try Again</span>
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full bg-white border-slate-300 text-slate-700 hover:bg-slate-50 text-xs px-4 py-2 rounded-md shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Home size={13} className="mr-1.5" />
              <span>Go Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
