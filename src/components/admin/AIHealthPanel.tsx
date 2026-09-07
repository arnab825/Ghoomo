'use client';

import React from 'react';
import { Cpu, ShieldCheck, Zap, Database, CheckCircle2, Clock } from 'lucide-react';
import ProgressIndicator from '@/components/shared/ProgressIndicator';

interface AIProviderStatus {
  name: string;
  tier: string;
  model: string;
  status: 'operational' | 'degraded' | 'limited';
  latencyMs: number;
  successRate: number;
}

interface AIHealthPanelProps {
  providers?: AIProviderStatus[];
  cachedResponseRate?: number;
  totalTokensToday?: number;
  fallbackCountToday?: number;
  className?: string;
}

export default function AIHealthPanel({
  providers,
  cachedResponseRate = 42,
  totalTokensToday = 142800,
  fallbackCountToday = 3,
  className = '',
}: AIHealthPanelProps) {
  const defaultProviders: AIProviderStatus[] = [
    {
      name: 'Google Gemini',
      tier: 'Primary',
      model: 'gemini-3.8-flash',
      status: 'operational',
      latencyMs: 840,
      successRate: 99.4,
    },
    {
      name: 'Groq Cloud',
      tier: 'Backup 1',
      model: 'llama-3.3-70b-versatile',
      status: 'operational',
      latencyMs: 310,
      successRate: 99.8,
    },
    {
      name: 'HuggingFace Engine',
      tier: 'Backup 2',
      model: 'Qwen/Qwen2.5-72B-Instruct',
      status: 'operational',
      latencyMs: 1450,
      successRate: 98.7,
    },
  ];

  const activeProviders = providers || defaultProviders;

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-3xs uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <Database size={13} className="text-saffron-500" />
            <span>Cached Responses</span>
          </div>
          <div className="text-xl font-bold font-heading text-slate-900 dark:text-white">
            {cachedResponseRate}%
          </div>
          <p className="text-3xs text-slate-500 mt-1">
            Zero-latency queries served from database cache
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-3xs uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <Zap size={13} className="text-indigo-500" />
            <span>Tokens Consumed Today</span>
          </div>
          <div className="text-xl font-bold font-heading text-slate-900 dark:text-white">
            {totalTokensToday.toLocaleString()}
          </div>
          <p className="text-3xs text-slate-500 mt-1">
            Under 10s serverless timeout budget
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-3xs uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Provider Backup Switches</span>
          </div>
          <div className="text-xl font-bold font-heading text-slate-900 dark:text-white">
            {fallbackCountToday}
          </div>
          <p className="text-3xs text-slate-500 mt-1">
            Seamless failovers without user disruption
          </p>
        </div>
      </div>

      {/* Provider Status Rows */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
          <Cpu size={14} className="text-saffron-500" />
          <span>AI Provider Status (Strict Fallback Architecture)</span>
        </h4>

        <div className="space-y-3">
          {activeProviders.map((provider) => (
            <div
              key={provider.name}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{provider.name}</span>
                    <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {provider.tier}
                    </span>
                  </div>
                  <div className="text-3xs text-slate-400 font-mono mt-0.5">
                    {provider.model}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-3xs font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{provider.latencyMs}ms avg</span>
                </div>
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {provider.successRate}%
                  </span>{' '}
                  success
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
