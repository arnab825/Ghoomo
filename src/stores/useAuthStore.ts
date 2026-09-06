import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserPersona {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'planner' | 'collaborator';
  avatarUrl: string;
  title: string;
  credits: number;
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim().toLowerCase();
  if (trimmed.length < 3 || trimmed.length > 20) {
    return { valid: false, error: 'Username must be between 3 and 20 characters.' };
  }
  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Only lowercase letters, numbers, and underscores are allowed.' };
  }
  return { valid: true };
}

export const INITIAL_USER: UserPersona = {
  id: 'user-traveler-8472',
  name: 'Aarav Patel',
  username: 'traveler_8472',
  email: 'aarav@ghoomo.travel',
  role: 'planner',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  title: 'Lead Explorer',
  credits: 9, // Exactly 9 free credits for 3 full AI itineraries (3 credits each)
};

export const DEMO_COLLABORATOR: UserPersona = {
  id: 'user-sneha-3190',
  name: 'Sneha Sharma',
  username: 'sneha_wander',
  email: 'sneha@ghoomo.travel',
  role: 'collaborator',
  avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80',
  title: 'Friend & Co-Traveler',
  credits: 9,
};

export const DEMO_PERSONAS: UserPersona[] = [INITIAL_USER, DEMO_COLLABORATOR];


interface AuthState {
  currentUser: UserPersona;
  isAuthenticated: boolean;
  updateUsername: (newUsername: string) => { success: boolean; error?: string };
  deductCredits: (amount: number) => { success: boolean; remaining: number };
  addCredits: (amount: number) => void;
  switchPersona: (userId: string) => void;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: INITIAL_USER,
      isAuthenticated: true,

      updateUsername: (newUsername: string) => {
        const validation = validateUsername(newUsername);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        const cleaned = newUsername.trim().toLowerCase();
        set((state) => ({
          currentUser: {
            ...state.currentUser,
            username: cleaned,
          },
        }));
        return { success: true };
      },

      deductCredits: (amount: number) => {
        const currentCredits = get().currentUser.credits ?? 9;
        if (currentCredits < amount) {
          return { success: false, remaining: currentCredits };
        }
        const updated = Math.max(0, currentCredits - amount);
        set((state) => ({
          currentUser: {
            ...state.currentUser,
            credits: updated,
          },
        }));
        return { success: true, remaining: updated };
      },

      addCredits: (amount: number) => {
        set((state) => ({
          currentUser: {
            ...state.currentUser,
            credits: (state.currentUser.credits ?? 0) + amount,
          },
        }));
      },

      switchPersona: (userId) => {
        if (userId === DEMO_COLLABORATOR.id) {
          set({ currentUser: DEMO_COLLABORATOR, isAuthenticated: true });
        } else {
          set({ currentUser: INITIAL_USER, isAuthenticated: true });
        }
      },

      login: (email: string) => {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const namePart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 12);
        const generatedUsername = `${namePart}_${randomNum}`.slice(0, 20);

        set({
          currentUser: {
            id: `user-${Date.now()}`,
            name: email.split('@')[0],
            username: generatedUsername,
            email,
            role: 'planner',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
            title: 'Traveler',
            credits: 9, // Brand new users get 9 credits
          },
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'ghoomo-auth-session-v3',
    }
  )
);
