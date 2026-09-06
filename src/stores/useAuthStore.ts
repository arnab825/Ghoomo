import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: 'planner' | 'collaborator';
  avatarUrl: string;
  title: string;
}

export const DEMO_PERSONAS: UserPersona[] = [
  {
    id: 'user-demo-aarav',
    name: 'Aarav Patel',
    email: 'aarav@ghoomo.travel',
    role: 'planner',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    title: 'Lead Trip Explorer',
  },
  {
    id: 'user-demo-sneha',
    name: 'Sneha Sharma',
    email: 'sneha@ghoomo.travel',
    role: 'collaborator',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80',
    title: 'Friend & Co-Traveler',
  },
];

interface AuthState {
  currentUser: UserPersona;
  isAuthenticated: boolean;
  switchPersona: (userId: string) => void;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: DEMO_PERSONAS[0],
      isAuthenticated: true,

      switchPersona: (userId) => {
        const found = DEMO_PERSONAS.find((p) => p.id === userId);
        if (found) {
          set({ currentUser: found, isAuthenticated: true });
        }
      },

      login: (email) => {
        set({
          currentUser: {
            id: `user-${Date.now()}`,
            name: email.split('@')[0],
            email,
            role: 'planner',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
            title: 'Traveler',
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
      name: 'ghoomo-auth-session',
    }
  )
);
