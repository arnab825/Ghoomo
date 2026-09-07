'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, BookOpen, Lightbulb, CheckCircle2 } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  content: React.ReactNode;
}

interface ContextPanelProps {
  title?: string;
  tabs: TabItem[];
  defaultTabId?: string;
  defaultCollapsed?: boolean;
  className?: string;
}

export default function ContextPanel({
  title = 'Study Companion',
  tabs,
  defaultTabId,
  defaultCollapsed = false,
  className = '',
}: ContextPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultTabId || (tabs.length > 0 ? tabs[0].id : '')
  );

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <aside
      className={`relative border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-12' : 'w-80 lg:w-96'
      } ${className}`}
    >
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3.5 top-6 z-20 h-7 w-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-saffron-500"
        aria-label={isCollapsed ? 'Expand side panel' : 'Collapse side panel'}
      >
        {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {isCollapsed ? (
        /* Collapsed Icon Bar */
        <div className="flex flex-col items-center py-6 gap-4">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTabId(tab.id);
                  setIsCollapsed(false);
                }}
                className={`p-2 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-saffron-500/10 text-saffron-600 dark:text-saffron-400'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={tab.label}
              >
                {tab.icon || <Sparkles size={18} />}
              </button>
            );
          })}
        </div>
      ) : (
        /* Expanded Panel Content */
        <div className="flex flex-col h-full overflow-hidden">
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h4 className="font-bold font-heading text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={16} className="text-saffron-500 shrink-0" />
              {title}
            </h4>
          </div>

          {/* Tab Navigation */}
          {tabs.length > 1 && (
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 px-2 pt-2 gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTabId(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 shrink-0 ${
                      isActive
                        ? 'border-saffron-500 text-saffron-600 dark:text-saffron-400 bg-white dark:bg-slate-900'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-3xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-5 text-sm">
            {activeTab?.content}
          </div>
        </div>
      )}
    </aside>
  );
}
