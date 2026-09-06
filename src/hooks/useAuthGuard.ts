'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, UserRole } from '@/stores/useAuthStore';

interface GuardOptions {
  requiredRole?: UserRole | 'any';
  redirectTo?: string;
}

export function useAuthGuard(options: GuardOptions = { requiredRole: 'any' }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, initializeAuth } = useAuthStore();

  // Initialize auth listener on first render if needed
  useEffect(() => {
    const cleanup = initializeAuth();
    return cleanup;
  }, [initializeAuth]);

  useEffect(() => {
    if (isLoading) return;

    // 1. Not logged in -> Redirect to login with return path
    if (!isAuthenticated || !user) {
      const redirectUrl = options.redirectTo || `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
      return;
    }

    // 2. Role enforcement
    if (options.requiredRole && options.requiredRole !== 'any') {
      if (user.role !== options.requiredRole) {
        // Redirect to unauthorized or appropriate dashboard
        if (user.role === 'teacher') {
          router.replace('/teacher/dashboard');
        } else if (user.role === 'student') {
          router.replace('/student/dashboard');
        } else {
          router.replace('/unauthorized');
        }
      }
    }
  }, [isAuthenticated, isLoading, user, options.requiredRole, options.redirectTo, router, pathname]);

  const isAuthorized =
    !isLoading &&
    isAuthenticated &&
    Boolean(user) &&
    (options.requiredRole === 'any' || !options.requiredRole || user?.role === options.requiredRole);

  return {
    user,
    role: user?.role,
    isLoading,
    isAuthorized,
  };
}
