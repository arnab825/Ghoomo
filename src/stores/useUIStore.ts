'use client';

import { create } from 'zustand';

interface UIState {
  // Navigation Modals
  isGoalWizardOpen: boolean;
  isCopilotOpen: boolean;
  isResourceModalOpen: boolean;

  // Auth Modal
  isAuthModalOpen: boolean;
  authModalMode: 'sign-in' | 'sign-up' | 'forgot-password';

  // Actions
  setGoalWizardOpen: (open: boolean) => void;
  setCopilotOpen: (open: boolean) => void;
  setResourceModalOpen: (open: boolean) => void;
  openAuthModal: (mode?: 'sign-in' | 'sign-up' | 'forgot-password') => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: 'sign-in' | 'sign-up' | 'forgot-password') => void;
}

export const useUIStore = create<UIState>((set) => ({
  isGoalWizardOpen: false,
  isCopilotOpen: false,
  isResourceModalOpen: false,

  isAuthModalOpen: false,
  authModalMode: 'sign-in',

  setGoalWizardOpen: (open) => set({ isGoalWizardOpen: open }),
  setCopilotOpen: (open) => set({ isCopilotOpen: open }),
  setResourceModalOpen: (open) => set({ isResourceModalOpen: open }),
  openAuthModal: (mode = 'sign-in') => set({ isAuthModalOpen: true, authModalMode: mode }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  setAuthModalMode: (mode) => set({ authModalMode: mode }),
}));
