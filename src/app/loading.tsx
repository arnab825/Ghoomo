import { Loader2 } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
      <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Loading...
      </p>
    </div>
  );
}
