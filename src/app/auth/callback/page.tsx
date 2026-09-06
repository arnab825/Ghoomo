'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore, UserRole } from '@/stores/useAuthStore';
import { syncProfileBackendAction } from '@/app/actions/authActions';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const { refreshProfile } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function handleAuth() {
      try {
        const code = searchParams.get('code');
        const roleParam = searchParams.get('role') as UserRole | null;
        const redirectParam = searchParams.get('redirect');

        // Check if OAuth provider returned an error
        const errorParam = searchParams.get('error');
        const errorDesc = searchParams.get('error_description');
        if (errorParam || errorDesc) {
          throw new Error(errorDesc || errorParam || 'Authentication failed.');
        }

        // 1. If PKCE exchange code is in the URL, exchange it for real Supabase session on backend
        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.error('[Auth Callback] Code exchange failed:', exchangeErr);
            throw exchangeErr;
          }
        }

        // 2. Retrieve active verified session from Supabase backend
        const {
          data: { session },
          error: sessionErr,
        } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        if (session?.user) {
          const userMetaRole = session.user.user_metadata?.role as UserRole | undefined;
          const targetRole: UserRole = roleParam || userMetaRole || 'student';

          // 3. Execute backend server action to sync database profile directly without localStorage
          await syncProfileBackendAction({
            userId: session.user.id,
            email: session.user.email || '',
            fullName:
              session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            role: targetRole,
            avatarUrl:
              session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          });

          // Hydrate client-side auth store
          const profile = await refreshProfile(targetRole);
          if (!mounted) return;

          const finalRole = profile?.role || targetRole;
          const destination =
            redirectParam ||
            (finalRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');

          window.location.replace(destination);
          return;
        }

        // 4. Listen for auth state change if session is still settling
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (newSession?.user && mounted) {
            subscription.unsubscribe();
            const userMetaRole = newSession.user.user_metadata?.role as UserRole | undefined;
            const targetRole: UserRole = roleParam || userMetaRole || 'student';

            await syncProfileBackendAction({
              userId: newSession.user.id,
              email: newSession.user.email || '',
              fullName:
                newSession.user.user_metadata?.full_name || newSession.user.user_metadata?.name,
              role: targetRole,
              avatarUrl:
                newSession.user.user_metadata?.avatar_url ||
                newSession.user.user_metadata?.picture,
            });

            const profile = await refreshProfile(targetRole);
            const finalRole = profile?.role || targetRole;
            const destination =
              redirectParam ||
              (finalRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');

            window.location.replace(destination);
          }
        });

        // 5. Timeout fallback after 6s
        const timer = setTimeout(() => {
          if (mounted) {
            subscription.unsubscribe();
            setAuthError(
              'Authentication timed out. Please check your connection and try signing in again.'
            );
          }
        }, 6000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err: unknown) {
        console.error('[Auth Callback] Processing error:', err);
        if (mounted) {
          setAuthError(
            err instanceof Error ? err.message : 'Authentication failed. Please try again.'
          );
        }
      }
    }

    handleAuth();

    return () => {
      mounted = false;
    };
  }, [router, searchParams, refreshProfile]);

  if (authError) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/40 text-center space-y-4 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Authentication Failed
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">{authError}</p>
          </div>
          <Link
            href="/login"
            className="inline-block text-xs font-semibold px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl transition-all shadow-md shadow-saffron-500/20"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center gap-3">
      <Loader2 size={36} className="animate-spin text-saffron-500" />
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        Authenticating with Google...
      </p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Syncing your profile with backend database...
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-saffron-500" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
