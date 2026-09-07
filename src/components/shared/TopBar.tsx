'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, Plus, Moon, Sun, MessageSquare, LogIn, User } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { Button } from '@/components/ui/button';

export default function TopBar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { setGoalWizardOpen, setCopilotOpen } = useUIStore();

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md h-16 flex items-center justify-between px-4 sm:px-6">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Compass size={20} />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-950 dark:text-white font-heading block leading-none">
              GHOOMO
            </span>
            <span className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 block tracking-wide">
              Smart Learning Guide
            </span>
          </div>
        </Link>
      </div>

      {/* Center / Right Actions */}
      <div className="flex items-center gap-2.5">
        {isAuthenticated ? (
          <>
            <Button
              onClick={() => setGoalWizardOpen(true)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-3 sm:px-4 shadow-2xs rounded-xl"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Goal</span>
            </Button>

            <button
              onClick={() => setCopilotOpen(true)}
              title="Open AI Learning Assistant"
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">AI Tutor</span>
            </button>
          </>
        ) : (
          <Link href="/auth/sign-in">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9">
              <LogIn size={14} />
              <span>Sign In</span>
            </Button>
          </Link>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Color Theme"
          className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <Sun size={15} className="hidden dark:block" />
          <Moon size={15} className="block dark:hidden" />
        </button>
      </div>
    </header>
  );
}
