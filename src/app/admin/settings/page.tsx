'use client';

import React, { useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Sliders, Cpu, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const [allowDeepRoadmaps, setAllowDeepRoadmaps] = useState(true);
  const [enableRealtimeAll, setEnableRealtimeAll] = useState(true);
  const [aiEvidenceEvalEnabled, setAiEvidenceEvalEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Platform & Operational Settings"
        subtitle="Configure feature flags, model routing preferences, and operational policies."
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-4xl">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
          <h3 className="font-bold text-base font-heading text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders size={16} className="text-saffron-500" />
            <span>Core Feature Flags</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Deep Roadmaps (15-50+ Topics)
                </div>
                <div className="text-3xs text-slate-500 mt-0.5">
                  Generate hierarchical multi-area roadmaps instead of shallow courses.
                </div>
              </div>
              <input
                type="checkbox"
                checked={allowDeepRoadmaps}
                onChange={(e) => setAllowDeepRoadmaps(e.target.checked)}
                className="h-4 w-4 rounded text-saffron-500 focus:ring-saffron-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Full Supabase Realtime Synchronization
                </div>
                <div className="text-3xs text-slate-500 mt-0.5">
                  Publish state, misconception, and attempt events across all client sockets.
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableRealtimeAll}
                onChange={(e) => setEnableRealtimeAll(e.target.checked)}
                className="h-4 w-4 rounded text-saffron-500 focus:ring-saffron-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  &quot;Show Your Work&quot; AI Evidence Evaluation
                </div>
                <div className="text-3xs text-slate-500 mt-0.5">
                  Enable automated code, trace, and reasoning feedback via AI reasoning layer.
                </div>
              </div>
              <input
                type="checkbox"
                checked={aiEvidenceEvalEnabled}
                onChange={(e) => setAiEvidenceEvalEnabled(e.target.checked)}
                className="h-4 w-4 rounded text-saffron-500 focus:ring-saffron-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {saved && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in">
                Settings saved successfully!
              </span>
            )}
            <Button
              onClick={handleSave}
              className="bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-xl flex items-center gap-2 px-5"
            >
              <Save size={15} />
              <span>Save Configuration</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
