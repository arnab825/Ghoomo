'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function DashboardRouterPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    const cleanup = initializeAuth();
    return cleanup;
  }, [initializeAuth]);

  useEffect(() => {
    if (!isLoading) {
      router.replace('/app');
    }
  }, [isLoading, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
      <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Routing to your learning map...
      </p>
    </div>
  );
}
