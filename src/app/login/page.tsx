'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import GhoomoLogo from '@/components/shared/GhoomoLogo';
import GoogleIcon from '@/components/shared/GoogleIcon';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const { login, signInWithGoogle, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email.trim() || !password) {
      setFormError('Please enter both your email address and password.');
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      setFormError(res.error || 'Invalid email or password.');
      return;
    }

    // Role-based redirect
    if (redirect) {
      router.push(redirect);
    } else if (res.role === 'teacher') {
      router.push('/teacher/dashboard');
    } else {
      router.push('/student/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    clearError();
    setIsGoogleLoading(true);

    try {
      const res = await signInWithGoogle('student', redirect);
      if (!res.success) {
        setFormError(res.error || 'Google sign-in failed. Please try again.');
        setIsGoogleLoading(false);
        return;
      }

      // If browser is redirecting to Google OAuth, stay in loading state and do not push to dashboard
      if (res.redirected) {
        return;
      }

      if (redirect) {
        router.push(redirect);
      } else {
        router.push('/student/dashboard');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred during Google sign-in.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-3">
          <GhoomoLogo size="md" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
          Sign In to Ghoomo
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Access your AI-powered smart learning journeys & assignments.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5 backdrop-blur-md">
        {(formError || error) && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{formError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-saffron-500 hover:text-saffron-600 dark:text-saffron-400 hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-saffron-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none enabled:cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 enabled:cursor-pointer disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In</span>
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-medium">
              Or continue with
            </span>
          </div>
        </div>

        {/* Continue with Google button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs flex items-center justify-center gap-2.5 transition-all enabled:cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-saffron-500"
        >
          {isGoogleLoading ? (
            <>
              <Loader2 size={16} className="animate-spin text-slate-500" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <GoogleIcon size={18} />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link
            href={`/signup${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-semibold text-saffron-500 dark:text-saffron-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Create Account</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <Suspense fallback={<div className="text-center text-xs text-slate-400">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
