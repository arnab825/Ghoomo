'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import GhoomoLogo from '@/components/shared/GhoomoLogo';
import { supabase } from '@/lib/supabase/client';

export default function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, authModalMode, closeAuthModal, setAuthModalMode } = useUIStore();
  const { signIn, signUp, isAuthenticated } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Close modal if already authenticated
  useEffect(() => {
    if (isAuthenticated && isAuthModalOpen) {
      closeAuthModal();
    }
  }, [isAuthenticated, isAuthModalOpen, closeAuthModal]);

  // Reset fields when mode changes or modal opens
  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [authModalMode, isAuthModalOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (authModalMode === 'forgot-password') {
      if (!email.trim()) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      setIsSubmitting(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Password reset instructions have been sent to your email.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to send reset link.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authModalMode === 'sign-up') {
        const res = await signUp({
          email: email.trim(),
          password,
          fullName: fullName.trim() || 'Learner',
        });
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.');
          setIsSubmitting(false);
          return;
        }
        closeAuthModal();
        router.push('/app');
      } else {
        const res = await signIn(email.trim(), password);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid email or password.');
          setIsSubmitting(false);
          return;
        }
        closeAuthModal();
        router.push('/app');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in with Google.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={closeAuthModal}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8 space-y-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-1">
              <GhoomoLogo size="sm" showSubtitle={false} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              {authModalMode === 'sign-in' && 'Welcome Back'}
              {authModalMode === 'sign-up' && 'Start Learning Today'}
              {authModalMode === 'forgot-password' && 'Reset Password'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {authModalMode === 'sign-in' && 'Sign in to access your personal learning roadmap.'}
              {authModalMode === 'sign-up' && 'Create your free account to track topics and progress.'}
              {authModalMode === 'forgot-password' && 'Enter your email to receive a password reset link.'}
            </p>
          </div>

          {/* Mode Switcher Tabs (Sign In vs Sign Up) */}
          {authModalMode !== 'forgot-password' && (
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAuthModalMode('sign-in')}
                className={`flex-1 py-2 rounded-lg text-center transition-all ${
                  authModalMode === 'sign-in'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthModalMode('sign-up')}
                className={`flex-1 py-2 rounded-lg text-center transition-all ${
                  authModalMode === 'sign-up'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Error & Success Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authModalMode === 'sign-up' && (
              <div className="space-y-1">
                <label className="text-2xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-2xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {authModalMode !== 'forgot-password' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-2xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {authModalMode === 'sign-in' && (
                    <button
                      type="button"
                      onClick={() => setAuthModalMode('forgot-password')}
                      className="text-2xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {authModalMode === 'sign-in' && 'Sign In'}
                    {authModalMode === 'sign-up' && 'Create Free Account'}
                    {authModalMode === 'forgot-password' && 'Send Reset Link'}
                  </span>
                  <ArrowRight size={14} />
                </>
              )}
            </Button>
          </form>

          {/* Social Sign-In */}
          {authModalMode !== 'forgot-password' && (
            <div className="space-y-3">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider relative">
                  Or continue with
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2.5 shadow-xs"
              >
                {isGoogleLoading ? (
                  <Loader2 size={15} className="animate-spin text-slate-500" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Google</span>
              </button>
            </div>
          )}

          {/* Footer Back Link */}
          {authModalMode === 'forgot-password' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthModalMode('sign-in')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
