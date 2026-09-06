/**
 * Ghoomo Local UI Store (Zustand)
 * STRICTLY for client-side local UI state:
 * - Active modal visibility (import, add place, share/collab)
 * - Active UI filters (active day filter, active tab)
 * - Selected interactive elements (selected place on map)
 * - Local drafts and optimistic UI flags
 *
 * (No server data or persistent entities are stored here;
 * all server data lives in TanStack Query).
 */

'use client';

import { create } from 'zustand';

export type WorkspaceTab = 'itinerary' | 'places' | 'budget';

interface UIState {
  // Modal visibility
  isImportModalOpen: boolean;
  isAddPlaceModalOpen: boolean;
  isCollabModalOpen: boolean;

  // Active filters and views
  activeTab: WorkspaceTab;
  selectedDayFilter: number | null;
  selectedPlaceId: string | null;

  // Actions
  setImportModalOpen: (open: boolean) => void;
  setAddPlaceModalOpen: (open: boolean) => void;
  setCollabModalOpen: (open: boolean) => void;
  setActiveTab: (tab: WorkspaceTab) => void;
  setSelectedDayFilter: (day: number | null) => void;
  setSelectedPlaceId: (id: string | null) => void;

  // Reset UI state (e.g. upon switching trips)
  resetUIState: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isImportModalOpen: false,
  isAddPlaceModalOpen: false,
  isCollabModalOpen: false,

  activeTab: 'itinerary',
  selectedDayFilter: null,
  selectedPlaceId: null,

  setImportModalOpen: (open) => set({ isImportModalOpen: open }),
  setAddPlaceModalOpen: (open) => set({ isAddPlaceModalOpen: open }),
  setCollabModalOpen: (open) => set({ isCollabModalOpen: open }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedDayFilter: (selectedDayFilter) => set({ selectedDayFilter }),
  setSelectedPlaceId: (selectedPlaceId) => set({ selectedPlaceId }),

  resetUIState: () =>
    set({
      isImportModalOpen: false,
      isAddPlaceModalOpen: false,
      isCollabModalOpen: false,
      activeTab: 'itinerary',
      selectedDayFilter: null,
      selectedPlaceId: null,
    }),
}));
