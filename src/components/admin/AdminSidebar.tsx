'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Map,
  Cpu,
  BarChart3,
  Activity,
  Settings,
  ArrowLeft,
  ShieldCheck,
  Compass,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: <LayoutDashboard size={17} />,
      },
    ],
  },
  {
    group: 'PRODUCT & USERS',
    items: [
      {
        label: 'Learners & Activity',
        href: '/admin/users',
        icon: <Users size={17} />,
      },
      {
        label: 'Roadmaps & Topics',
        href: '/admin/learning',
        icon: <Map size={17} />,
      },
      {
        label: 'Learning Analytics',
        href: '/admin/analytics',
        icon: <BarChart3 size={17} />,
      },
    ],
  },
  {
    group: 'AI & INFRASTRUCTURE',
    items: [
      {
        label: 'AI Provider Health',
        href: '/admin/ai',
        icon: <Cpu size={17} />,
      },
      {
        label: 'System & Database',
        href: '/admin/system',
        icon: <Activity size={17} />,
      },
      {
        label: 'Platform Settings',
        href: '/admin/settings',
        icon: <Settings size={17} />,
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-saffron-500 text-white flex items-center justify-center font-bold font-heading text-sm shadow-xs">
            G
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white font-heading">
              Ghoomo Admin
            </div>
            <div className="text-3xs font-semibold text-saffron-600 dark:text-saffron-400">
              Operations Center
            </div>
          </div>
        </div>
        <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500" title="Admin access verified">
          <ShieldCheck size={16} />
        </div>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 text-3xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {group.group}
            </div>
            {group.items.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-saffron-500/10 text-saffron-600 dark:text-saffron-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-saffron-500' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer: Return to Learner Experience */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <Link
          href="/app"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          <ArrowLeft size={15} />
          <span>Learner Experience</span>
        </Link>
      </div>
    </aside>
  );
}
