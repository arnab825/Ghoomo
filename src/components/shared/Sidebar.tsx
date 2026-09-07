'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Target, Archive, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navLinks = [
    { href: '/app', label: 'Dashboard', icon: Home },
    { href: '/app/goals', label: 'My Courses', icon: Target },
    { href: '/app/archive', label: 'Archive', icon: Archive },
    { href: '/app/settings', label: 'Settings', icon: Settings },
  ];

  // Derive initial from user's name
  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'L';

  return (
    <aside className="w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-16 h-[calc(100vh-4rem)] flex flex-col justify-between p-4 hidden md:flex shrink-0 overflow-hidden select-none z-30">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block mb-2.5">
            Menu
          </span>
          <nav className="space-y-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/app' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-indigo-500 to-indigo-700 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate leading-tight">
                {user?.fullName || 'Learner'}
              </span>
              <span className="inline-flex items-center gap-1 text-3xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Learner
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
