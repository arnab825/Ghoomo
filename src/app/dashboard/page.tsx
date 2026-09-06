'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Loader2 } from 'lucide-react';

export default function DashboardRouterPage() {
  const router = useRouter();
  const { user, isLoading, isAuthorized } = useAuthGuard({ requiredRole: 'any' });

  useEffect(() => {
    if (!isLoading && isAuthorized && user) {
      if (user.role === 'teacher') {
        router.replace('/teacher/dashboard');
      } else {
        router.replace('/student/dashboard');
      }
    }
  }, [user, isLoading, isAuthorized, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
      <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Loading your learning dashboard...
      </p>
    </div>
  );
}
