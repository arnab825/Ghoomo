'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore, validateUsername } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import {
  User,
  Sparkles,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Zap,
  FolderHeart
} from 'lucide-react';

export default function ProfileSettingsPage() {
  const { currentUser, updateUsername, addCredits } = useAuthStore();
  const [usernameInput, setUsernameInput] = useState(currentUser.username || 'traveler_8472');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const result = updateUsername(usernameInput);
    if (result.success) {
      setStatusMessage({ type: 'success', text: `Username successfully updated to @${usernameInput.trim().toLowerCase()}` });
    } else {
      setStatusMessage({ type: 'error', text: result.error || 'Failed to update username.' });
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-normal text-slate-900 dark:text-white font-heading">
          Profile & <span className="text-teal-600 italic">Account Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your traveler username, inspect credit balances, and review billing status.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-md text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Credits Snapshot */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-5 text-center flex flex-col items-center">
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="h-24 w-24 rounded-full object-cover border-4 border-slate-100 shadow-md dark:border-slate-800"
            />
            <div className="absolute bottom-0 right-0 bg-teal-600 text-white p-1.5 rounded-full shadow-xs">
              <ShieldCheck size={14} />
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              {currentUser.name}
            </h3>
            <p className="text-xs font-mono text-teal-700 dark:text-teal-400 font-semibold">
              @{currentUser.username}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{currentUser.email}</p>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">AI Credits:</span>
              <span className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-sm">
                {currentUser.credits ?? 9} Credits
              </span>
            </div>
            <Link href="/pricing" className="block pt-2">
              <Button
                size="sm"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-md shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <Zap size={13} className="mr-1" />
                <span>Buy Credits</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Edit Username Form & Account Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                Unique Username
              </h3>
              <p className="text-xs text-slate-500">
                Your username identifies you on collaborative trip planning, live polls, and shared itineraries.
              </p>
            </div>

            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Username handle
                </label>
                <div className="flex rounded-md shadow-xs">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    @
                  </span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                    placeholder="traveler_8472"
                    className="flex-1 rounded-none rounded-r-md border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  3–20 characters. Lowercase letters, numbers, and underscores only.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs active:scale-[0.98] cursor-pointer dark:bg-white dark:text-slate-900"
                >
                  Save Username
                </Button>
              </div>
            </form>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Link
                href="/trips"
                className="flex items-center justify-between p-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderHeart size={15} className="text-teal-600" />
                  <span>Your Trips Library</span>
                </div>
                <ArrowRight size={13} className="text-slate-400" />
              </Link>

              <Link
                href="/pricing"
                className="flex items-center justify-between p-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CreditCard size={15} className="text-orange-500" />
                  <span>Pricing & Top-ups</span>
                </div>
                <ArrowRight size={13} className="text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
