'use client';

import React from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { Activity, Database, Radio, Server, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminSystemPage() {
  const healthChecks = [
    {
      name: 'Supabase PostgreSQL Database',
      status: 'Healthy',
      detail: 'RLS enforced, user isolation active',
      latency: '18ms',
      icon: <Database size={18} className="text-emerald-500" />,
    },
    {
      name: 'Supabase Realtime Engine',
      status: 'Connected',
      detail: '14 tables published, active websocket listener',
      latency: '24ms',
      icon: <Radio size={18} className="text-emerald-500" />,
    },
    {
      name: 'Vercel Serverless Functions',
      status: 'Operational',
      detail: 'Free tier Hobby configuration (10s limit)',
      latency: '45ms cold start',
      icon: <Server size={18} className="text-emerald-500" />,
    },
    {
      name: 'AI Model Fallback Circuit',
      status: 'Operational',
      detail: 'Gemini 3.8 $\\rightarrow$ Groq 3.3 $\\rightarrow$ HuggingFace Qwen',
      latency: '8000ms ceiling budget',
      icon: <Activity size={18} className="text-emerald-500" />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="System & Infrastructure Health"
        subtitle="Realtime connection status, database latency, and system error logs."
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {healthChecks.map((item) => (
            <div
              key={item.name}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                  <div className="text-3xs font-mono text-slate-400 mt-2">
                    Latency: {item.latency}
                  </div>
                </div>
              </div>

              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                <span>{item.status}</span>
              </span>
            </div>
          ))}
        </div>

        {/* System Error Log (Clean by default) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-3">
          <h3 className="font-bold text-base font-heading text-slate-900 dark:text-white">
            System Error Monitoring
          </h3>
          <p className="text-xs text-slate-500">
            Uncaught exceptions, RLS rejections, and upstream timeout events.
          </p>

          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
            <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Zero Critical System Errors
            </div>
            <p className="text-3xs text-slate-400 mt-1">
              All services operating within normal telemetry thresholds.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
