'use client';

import React from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import AIHealthPanel from '@/components/admin/AIHealthPanel';
import TrendChart from '@/components/admin/TrendChart';
import { Cpu, ShieldAlert, Sparkles, Database, Zap, Clock } from 'lucide-react';

export default function AdminAIPage() {
  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="AI Provider Health & Telemetry"
        subtitle="Observe model response times, 3-tier fallback execution, token costs, and cache hit rates."
      />

      <main className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* Full AI Health Panel */}
        <AIHealthPanel />

        {/* Latency Trends by Tier */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-heading text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock size={16} className="text-saffron-500" />
                  <span>Primary Tier Latency (Gemini 3.8 Flash)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Average millisecond latency per structured generation
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                840ms avg
              </span>
            </div>

            <TrendChart
              data={[920, 880, 840, 810, 850, 830, 840]}
              labels={['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now']}
              color="saffron"
              height={120}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-heading text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap size={16} className="text-indigo-500" />
                  <span>Backup Tier 1 Latency (Groq Llama 3.3)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sub-second high-throughput failover response
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                310ms avg
              </span>
            </div>

            <TrendChart
              data={[340, 310, 290, 320, 305, 315, 310]}
              labels={['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now']}
              color="indigo"
              height={120}
            />
          </div>
        </div>

        {/* Fallback Log */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base font-heading text-slate-900 dark:text-white">
            Recent Model Fallback Log
          </h3>
          <p className="text-xs text-slate-500">
            Automated transitions when rate limits or upstream timeouts occur.
          </p>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            <div className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Gemini 3.8 Flash $\rightarrow$ Groq Llama-3.3-70b
                  </span>
                  <div className="text-3xs text-slate-400">
                    Upstream rate limit (429) automatically recovered in 320ms
                  </div>
                </div>
              </div>
              <span className="text-3xs font-mono text-slate-400">2 hours ago</span>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Groq $\rightarrow$ HuggingFace Qwen-2.5-Coder
                  </span>
                  <div className="text-3xs text-slate-400">
                    Heavy code evaluation routed to specialized code model
                  </div>
                </div>
              </div>
              <span className="text-3xs font-mono text-slate-400">5 hours ago</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
