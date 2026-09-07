'use client';

/**
 * Ghoomo Realtime Connection Status Indicator
 * Minimal UI badge showing Supabase Realtime connection health.
 * - 🟢 Connected (nearly invisible, appears on hover)
 * - 🟡 Reconnecting... (pulse animation, visible)
 * - 🔴 Disconnected (visible with "data may be stale" warning)
 */

import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface RealtimeStatusProps {
  status: 'connected' | 'reconnecting' | 'disconnected';
}

export default function RealtimeStatus({ status }: RealtimeStatusProps) {
  if (status === 'connected') {
    return (
      <div
        className="group fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-2 py-1
                    rounded-full bg-emerald-500/10 border border-emerald-500/20
                    opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-default"
        title="Realtime connected"
        role="status"
        aria-label="Live data connection active"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hidden group-hover:inline">
          Live
        </span>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5
                    rounded-full bg-amber-500/10 border border-amber-500/30
                    animate-pulse transition-all duration-300"
        role="alert"
        aria-live="polite"
        aria-label="Reconnecting to live data"
      >
        <Loader2 size={12} className="animate-spin text-amber-500" />
        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
          Reconnecting…
        </span>
      </div>
    );
  }

  // disconnected
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5
                  rounded-full bg-red-500/10 border border-red-500/30
                  transition-all duration-300"
      role="alert"
      aria-live="assertive"
      aria-label="Disconnected from live data. Data may be stale."
    >
      <WifiOff size={12} className="text-red-500" />
      <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">
        Offline — data may be stale
      </span>
    </div>
  );
}
