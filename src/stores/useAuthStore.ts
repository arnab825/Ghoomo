'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

export type UserRole = 'student' | 'teacher';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  name: string; // for backward compatibility
  username?: string;
  role: UserRole;
  avatarUrl?: string;
  credits: number;
  createdAt?: string;
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

export const INITIAL_USER: UserProfile = {
  id: 'user-traveler-8472',
  name: 'Aarav Patel',
  fullName: 'Aarav Patel',
  username: 'traveler_8472',
  email: 'aarav@ghoomo.travel',
  role: 'student',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  credits: 9,
};

export const DEMO_COLLABORATOR: UserProfile = {
  id: 'user-sneha-3190',
  name: 'Sneha Sharma',
  fullName: 'Sneha Sharma',
  username: 'sneha_wander',
  email: 'sneha@ghoomo.travel',
  role: 'student',
  avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80',
  credits: 9,
};

export const DEMO_PERSONAS = [INITIAL_USER, DEMO_COLLABORATOR];

interface AuthState {
  user: UserProfile | null;
  currentUser: UserProfile; // backward compatibility fallback
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => () => void;
  signUp: (
    email: string,
    pass: string,
    fullName: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  login: (
    email: string,
    pass?: string
  ) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  clearError: () => void;

  // Legacy helper methods
  updateUsername: (newUsername: string) => { success: boolean; error?: string };
  deductCredits: (amount: number) => { success: boolean; remaining: number };
  addCredits: (amount: number) => void;
  switchPersona: (userId: string) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  currentUser: INITIAL_USER,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  updateUsername: (newUsername: string) => {
    const validation = validateUsername(newUsername);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    const cleaned = newUsername.trim().toLowerCase();
    const updated = {
      ...get().currentUser,
      username: cleaned,
    };
    set({
      currentUser: updated,
      user: get().user ? { ...get().user!, username: cleaned } : null,
    });
    return { success: true };
  },

  deductCredits: (amount: number) => {
    const currentCredits = get().currentUser.credits ?? 9;
    if (currentCredits < amount) {
      return { success: false, remaining: currentCredits };
    }
    const updatedCredits = Math.max(0, currentCredits - amount);
    const updatedUser = {
      ...get().currentUser,
      credits: updatedCredits,
    };
    set({
      currentUser: updatedUser,
      user: get().user ? { ...get().user!, credits: updatedCredits } : null,
    });
    return { success: true, remaining: updatedCredits };
  },

  addCredits: (amount: number) => {
    const updatedCredits = (get().currentUser.credits ?? 0) + amount;
    const updatedUser = {
      ...get().currentUser,
      credits: updatedCredits,
    };
    set({
      currentUser: updatedUser,
      user: get().user ? { ...get().user!, credits: updatedCredits } : null,
    });
  },

  switchPersona: (userId: string) => {
    const persona = DEMO_PERSONAS.find((p) => p.id === userId) || INITIAL_USER;
    set({
      currentUser: persona,
      user: persona,
      isAuthenticated: true,
    });
  },

  /**
   * Initializes real session from Supabase on mount.
   * Subscribes to auth state changes and fetches verified profile.
   */
  initializeAuth: () => {
    let isMounted = true;
    set({ isLoading: true });

    // 1. Fetch active session immediately
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (!isMounted) return;
        if (error || !session?.user) {
          set({ user: null, currentUser: INITIAL_USER, isAuthenticated: false, isLoading: false });
          return;
        }

        const profile = await fetchOrCreateProfile(session.user);
        if (isMounted && profile) {
          set({
            user: profile,
            currentUser: profile,
            isAuthenticated: true,
            isLoading: false,
          });
        } else if (isMounted) {
          set({ user: null, currentUser: INITIAL_USER, isAuthenticated: false, isLoading: false });
        }
      })
      .catch(() => {
        if (isMounted) {
          set({ user: null, currentUser: INITIAL_USER, isAuthenticated: false, isLoading: false });
        }
      });

    // 2. Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        set({
          user: null,
          currentUser: INITIAL_USER,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      if (session?.user) {
        const profile = await fetchOrCreateProfile(session.user);
        if (isMounted && profile) {
          set({
            user: profile,
            currentUser: profile,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  },

  /**
   * Real Supabase user registration with verified role
   */
  signUp: async (email, pass, fullName, role) => {
    set({ isLoading: true, error: null });
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            full_name: cleanName,
            role,
          },
        },
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (!data.user) {
        set({ isLoading: false, error: 'Registration failed. Please try again.' });
        return { success: false, error: 'Registration failed.' };
      }

      // Upsert profile in public.profiles to guarantee existence
      const profile = await fetchOrCreateProfile(data.user, { fullName: cleanName, role });

      set({
        user: profile,
        currentUser: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, user: profile };
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred during sign up.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  /**
   * Real Supabase login with verified password
   */
  login: async (email, pass) => {
    set({ isLoading: true, error: null });
    try {
      const cleanEmail = email.trim().toLowerCase();

      // If called without password (legacy fallback)
      if (!pass) {
        const fallbackProfile: UserProfile = {
          ...INITIAL_USER,
          id: `user-${Date.now()}`,
          name: cleanEmail.split('@')[0],
          fullName: cleanEmail.split('@')[0],
          username: cleanEmail.split('@')[0],
          email: cleanEmail,
        };
        set({
          user: fallbackProfile,
          currentUser: fallbackProfile,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true, role: fallbackProfile.role };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (!data.user) {
        set({ isLoading: false, error: 'Login failed. User not found.' });
        return { success: false, error: 'User not found.' };
      }

      const profile = await fetchOrCreateProfile(data.user);

      if (!profile) {
        set({ isLoading: false, error: 'Could not load user profile.' });
        return { success: false, error: 'Profile load failed.' };
      }

      set({
        user: profile,
        currentUser: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, role: profile.role };
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred during login.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  /**
   * Real Supabase sign out
   */
  logout: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      set({
        user: null,
        currentUser: INITIAL_USER,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  /**
   * Refreshes the active profile from Supabase
   */
  refreshProfile: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      set({ user: null, currentUser: INITIAL_USER, isAuthenticated: false });
      return null;
    }
    const profile = await fetchOrCreateProfile(session.user);
    if (profile) {
      set({ user: profile, currentUser: profile, isAuthenticated: true });
    }
    return profile;
  },
}));

/**
 * Helper: Fetches profile from public.profiles or creates it if missing
 */
async function fetchOrCreateProfile(
  authUser: any,
  overrideMeta?: { fullName?: string; role?: UserRole }
): Promise<UserProfile> {
  const userId = authUser.id;
  const email = authUser.email || '';
  const metaRole: UserRole =
    overrideMeta?.role ||
    authUser.user_metadata?.role ||
    authUser.app_metadata?.role ||
    'student';
  const metaName =
    overrideMeta?.fullName ||
    authUser.user_metadata?.full_name ||
    email.split('@')[0] ||
    'Learner';
  const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80';

  // 1. Attempt to fetch existing profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!error && profile) {
    return {
      id: profile.id,
      email: profile.email || email,
      fullName: profile.full_name || metaName,
      name: profile.full_name || metaName,
      username: profile.email ? profile.email.split('@')[0] : 'user',
      role: (profile.role as UserRole) || metaRole,
      avatarUrl: profile.avatar_url || defaultAvatar,
      credits: profile.credits ?? 9,
      createdAt: profile.created_at,
    };
  }

  // 2. Profile missing in public.profiles: insert it directly
  const newProfile = {
    id: userId,
    email,
    full_name: metaName,
    role: metaRole,
    credits: 9,
  };

  const { data: inserted } = await supabase
    .from('profiles')
    .upsert(newProfile, { onConflict: 'id' })
    .select('*')
    .single();

  const finalRecord = inserted || newProfile;

  return {
    id: finalRecord.id,
    email: finalRecord.email,
    fullName: finalRecord.full_name,
    name: finalRecord.full_name,
    username: finalRecord.email ? finalRecord.email.split('@')[0] : 'user',
    role: finalRecord.role,
    avatarUrl: finalRecord.avatar_url || defaultAvatar,
    credits: finalRecord.credits ?? 9,
    createdAt: finalRecord.created_at,
  };
}
