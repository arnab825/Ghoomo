'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import GhoomoLogo from '@/components/shared/GhoomoLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetErr) {
        setError(resetErr.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <GhoomoLogo size="md" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Reset Your Password
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your email to receive a secure password reset link.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5 backdrop-blur-md">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Check Your Inbox</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  We sent password reset instructions to <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>.
                </p>
              </div>
              <Link href="/login" className="inline-block pt-2">
                <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@school.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-saffron-500 transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 enabled:cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
