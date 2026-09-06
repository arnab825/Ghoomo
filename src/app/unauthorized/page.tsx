'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  const { user } = useAuthStore();

  const dashboardUrl = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto shadow-md">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Access Restricted
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            You do not have permission to view this page. This section requires a different role ({user?.role ? `you are currently signed in as a ${user.role}` : 'you are not signed in'}).
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          {user ? (
            <Link href={dashboardUrl}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2">
                <LayoutDashboard size={14} />
                <span>Go to My Dashboard</span>
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2">
                <ArrowLeft size={14} />
                <span>Sign In with Proper Role</span>
              </Button>
            </Link>
          )}

          <Link href="/">
            <Button variant="outline" className="text-xs font-semibold py-2.5 px-4 rounded-xl">
              <Home size={14} className="mr-1.5" />
              <span>Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
