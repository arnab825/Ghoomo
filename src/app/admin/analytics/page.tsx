'use client';

import React from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import TrendChart from '@/components/admin/TrendChart';
import MetricCard from '@/components/admin/MetricCard';
import { BarChart3, Award, CheckCircle2, TrendingUp, Compass } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Learning Analytics & Mastery Rates"
        subtitle="Platform-wide mastery attainment, completion metrics, and learning retention."
      />

      <main className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Roadmap Completion Rate"
            value="68.4%"
            change="+6.2% MoM"
            trend="up"
            icon={<CheckCircle2 size={18} className="text-emerald-500" />}
            description="Learners completing all required core topics"
          />
          <MetricCard
            title="Average Time to Mastery"
            value="4.2 Days"
            change="-18% faster"
            trend="up"
            icon={<TrendingUp size={18} className="text-saffron-500" />}
            description="From initial diagnostic to proven demonstrated mastery"
          />
          <MetricCard
            title="30-Day Retention"
            value="81.6%"
            change="+4.5%"
            trend="up"
            icon={<Compass size={18} className="text-indigo-500" />}
            description="Learners returning for smart review & progression"
          />
        </div>

        {/* Mastery Attainment Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base font-heading text-slate-900 dark:text-white">
                Demonstrated Mastery Velocity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cumulative topics promoted to MASTERED across all learners
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-saffron-500/10 text-saffron-600 dark:text-saffron-400">
              High Mastery Retention
            </span>
          </div>

          <TrendChart
            data={[120, 150, 195, 240, 310, 395, 480]}
            labels={['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7']}
            color="emerald"
            height={160}
          />
        </div>
      </main>
    </div>
  );
}
