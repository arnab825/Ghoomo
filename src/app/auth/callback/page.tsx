'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      try {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const errorDesc = searchParams.get('error_description');

        if (errorParam || errorDesc) {
          throw new Error(errorDesc || errorParam || 'Authentication failed.');
        }

        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) throw exchangeErr;
        }

        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        if (session?.user) {
          window.location.replace('/app');
          return;
        }

        // Wait on auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession?.user) {
            subscription.unsubscribe();
            window.location.replace('/app');
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err: any) {
        setAuthError(err.message || 'Authentication failed.');
      }
    }

    handleAuth();
  }, [searchParams]);

  if (authError) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 text-center space-y-4">
          <AlertCircle size={24} className="mx-auto text-red-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Authentication Failed</h3>
          <p className="text-xs text-slate-600">{authError}</p>
          <Link href="/login" className="inline-block text-xs font-semibold px-4 py-2 bg-indigo-600 text-white rounded-xl">
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <Loader2 size={36} className="animate-spin text-indigo-600" />
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        Completing authentication...
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-xs">Loading...</div>}>
      <CallbackHandler />
    </Suspense>
  );
}
