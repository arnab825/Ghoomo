'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import GoalWizardModal from '../learning/GoalWizardModal';
import CopilotDrawer from '../learning/CopilotDrawer';
import { useAuthStore } from '@/stores/useAuthStore';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { initializeAuth, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    const cleanup = initializeAuth();
    return cleanup;
  }, [initializeAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <TopBar />
      <div className="flex-1 flex w-full min-w-0 overflow-x-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <GoalWizardModal />
      <CopilotDrawer
        goalTitle="Your Learning Path"
        conceptName="Active Lesson"
        learnerState="Studying"
        activityTitle="Current Lesson"
      />
    </div>
  );
}
