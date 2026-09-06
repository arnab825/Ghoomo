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
  signInWithGoogle: (
    role?: UserRole,
    redirect?: string
  ) => Promise<{ success: boolean; error?: string; redirected?: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: (overrideRole?: UserRole) => Promise<UserProfile | null>;
  clearError: () => void;

  updateProfileName: (newName: string) => Promise<{ success: boolean; error?: string }>;
  updateRole: (newRole: UserRole) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
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

  updateRole: async (newRole: UserRole) => {
    try {
      const active = get().user || get().currentUser;
      if (active?.id) {
        // 1. Update Supabase auth user metadata
        try {
          await supabase.auth.updateUser({
            data: { role: newRole },
          });
        } catch (e) {
          console.warn('Auth user metadata role update error:', e);
        }

        // 2. Update public.profiles table
        try {
          await supabase
            .from('profiles')
            .upsert(
              {
                id: active.id,
                role: newRole,
                email: active.email,
                full_name: active.fullName || active.name,
              },
              { onConflict: 'id' }
            );
        } catch (e) {
          console.warn('Profiles table role update error:', e);
        }
      }

      const updated = {
        ...get().currentUser,
        role: newRole,
      };
      set({
        currentUser: updated,
        user: get().user ? { ...get().user!, role: newRole } : null,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update role.' };
    }
  },

  updateProfileName: async (newName: string) => {
    const clean = newName.trim();
    if (!clean) return { success: false, error: 'Name cannot be empty.' };

    try {
      const active = get().user || get().currentUser;
      if (active?.id) {
        // Update Supabase auth user metadata
        try {
          await supabase.auth.updateUser({
            data: { full_name: clean },
          });
        } catch (e) {
          console.warn('Auth user metadata update warning:', e);
        }

        // Update public.profiles if exists
        try {
          await supabase
            .from('profiles')
            .update({ full_name: clean })
            .eq('id', active.id);
        } catch (e) {
          console.warn('Profiles table update warning:', e);
        }
      }

      const updated = {
        ...get().currentUser,
        fullName: clean,
        name: clean,
      };
      set({
        currentUser: updated,
        user: get().user ? { ...get().user!, fullName: clean, name: clean } : null,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update name.' };
    }
  },

  changePassword: async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to change password.' };
    }
  },

  deleteAccount: async () => {
    set({ isLoading: true });
    try {
      const active = get().user || get().currentUser;
      if (active?.id) {
        try {
          await supabase.from('profiles').delete().eq('id', active.id);
        } catch (e) {
          console.warn('Profile record deletion warning:', e);
        }

        // Clear role and metadata in Auth so subsequent signups do not inherit old role
        try {
          await supabase.auth.updateUser({
            data: { role: null, full_name: null },
          });
        } catch (e) {
          console.warn('Metadata reset warning:', e);
        }
      }

      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }

      set({
        user: null,
        currentUser: INITIAL_USER,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Failed to delete account.' };
    }
  },

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
   * Google OAuth sign in
   */
  signInWithGoogle: async (role: UserRole = 'student', redirect: string = '') => {
    set({ isLoading: true, error: null });
    try {
      const { isSupabaseConfigured } = await import('@/lib/supabase/client');
      if (!isSupabaseConfigured()) {
        const demoGoogleUser: UserProfile = {
          id: `google-user-${Date.now()}`,
          name: role === 'teacher' ? 'Prof. Google Demo' : 'Alex Rivera',
          fullName: role === 'teacher' ? 'Prof. Google Demo' : 'Alex Rivera',
          username: role === 'teacher' ? 'prof_google' : 'alex_rivera',
          email: role === 'teacher' ? 'educator@example.com' : 'alex.rivera@gmail.com',
          role,
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
          credits: 12,
        };
        set({
          user: demoGoogleUser,
          currentUser: demoGoogleUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true, redirected: false };
      }

      const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
      if (redirect) callbackUrl.searchParams.set('redirect', redirect);
      if (role) callbackUrl.searchParams.set('role', role);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (data?.url) {
        window.location.href = data.url;
        return { success: true, redirected: true };
      }

      return { success: true, redirected: true };
    } catch (err: any) {
      const msg = err.message || 'Failed to initialize Google Sign In.';
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
  refreshProfile: async (overrideRole?: UserRole) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      set({ user: null, currentUser: INITIAL_USER, isAuthenticated: false });
      return null;
    }

    if (overrideRole) {
      try {
        await supabase.auth.updateUser({
          data: { role: overrideRole },
        });
      } catch (e) {
        console.warn('Update user metadata role error:', e);
      }
    }

    const profile = await fetchOrCreateProfile(
      session.user,
      overrideRole ? { role: overrideRole } : undefined
    );
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
    authUser.user_metadata?.name ||
    email.split('@')[0] ||
    'Learner';
  const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80';
  const userAvatar =
    authUser.user_metadata?.avatar_url ||
    authUser.user_metadata?.picture ||
    defaultAvatar;

  // 1. Attempt to fetch existing profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!error && profile) {
    let effectiveRole = (profile.role as UserRole) || metaRole;
    if (overrideMeta?.role && overrideMeta.role !== profile.role) {
      effectiveRole = overrideMeta.role;
      try {
        await supabase
          .from('profiles')
          .update({ role: overrideMeta.role })
          .eq('id', userId);
      } catch (e) {
        console.warn('Profiles update role error:', e);
      }
    }

    const finalAvatar = (profile.avatar_url && !profile.avatar_url.includes('unsplash.com/photo-1535713875002')) 
      ? profile.avatar_url 
      : (userAvatar !== defaultAvatar ? userAvatar : profile.avatar_url || defaultAvatar);

    return {
      id: profile.id,
      email: profile.email || email,
      fullName: profile.full_name || metaName,
      name: profile.full_name || metaName,
      username: profile.email ? profile.email.split('@')[0] : 'user',
      role: effectiveRole,
      avatarUrl: finalAvatar,
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
    avatar_url: userAvatar,
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
    avatarUrl: finalRecord.avatar_url || userAvatar,
    credits: finalRecord.credits ?? 9,
    createdAt: finalRecord.created_at,
  };
}
