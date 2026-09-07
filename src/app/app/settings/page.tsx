'use client';

import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { User, Mail, Shield, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
          Settings & Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your account credentials, accessibility preferences, and navigation profile.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-2xs text-slate-400">
          Account Profile
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || 'User Avatar'}
                className="h-11 w-11 rounded-full object-cover shadow-xs border border-slate-200 dark:border-slate-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <User size={18} />
              </div>
            )}
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {user?.fullName || 'Active Learner'}
              </span>
              <span className="text-2xs text-slate-500 block">
                {user?.email || 'learner@eduspark.edu'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Account Status
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">
              Active Learner
            </span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-indigo-900 dark:text-indigo-200 block">
                Subscription Plan
              </span>
              <span className="text-2xs text-indigo-700 dark:text-indigo-300">
                Manage active course capacity and billing
              </span>
            </div>
            <a
              href="/pricing"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-2xs transition-colors"
            >
              View Plans
            </a>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button
            variant="outline"
            onClick={() => logout()}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900 flex items-center gap-2"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
