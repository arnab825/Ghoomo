'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles, BookOpen, Compass } from 'lucide-react';

export interface ActivityEvent {
  id: string;
  type: 'mastery' | 'misconception' | 'attempt' | 'goal_created';
  learnerName: string;
  topicTitle: string;
  timestamp: string;
  detail?: string;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
  className?: string;
}

export default function ActivityFeed({ events, className = '' }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
        No recent activity events recorded.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {events.map((event) => {
        const icon =
          event.type === 'mastery' ? (
            <CheckCircle2 size={15} className="text-emerald-500" />
          ) : event.type === 'misconception' ? (
            <AlertCircle size={15} className="text-rose-500" />
          ) : event.type === 'goal_created' ? (
            <Compass size={15} className="text-saffron-500" />
          ) : (
            <Sparkles size={15} className="text-indigo-500" />
          );

        return (
          <div
            key={event.id}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 shrink-0 mt-0.5">
                {icon}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 dark:text-white truncate">
                  {event.learnerName}{' '}
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    {event.type === 'mastery'
                      ? 'achieved mastery in'
                      : event.type === 'misconception'
                      ? 'clearing up idea in'
                      : event.type === 'goal_created'
                      ? 'created new journey for'
                      : 'completed practice in'}
                  </span>{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {event.topicTitle}
                  </span>
                </div>
                {event.detail && (
                  <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {event.detail}
                  </p>
                )}
              </div>
            </div>

            <span className="text-3xs text-slate-400 shrink-0 font-mono">
              {event.timestamp}
            </span>
          </div>
        );
      })}
    </div>
  );
}
