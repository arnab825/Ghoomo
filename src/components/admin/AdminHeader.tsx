'use client';

import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import RealtimeStatus from '@/components/shared/RealtimeStatus';
import { Bell, Search, ShieldCheck } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function AdminHeader({
  title,
  subtitle,
  actions,
}: AdminHeaderProps) {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-lg sm:text-xl font-bold font-heading text-slate-900 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {/* Realtime Live Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-3xs font-bold text-emerald-700 dark:text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Operations</span>
        </div>

        {/* Admin profile chip */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
              {user?.email || 'Platform Operator'}
            </div>
            <div className="text-3xs text-slate-400">Administrator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
