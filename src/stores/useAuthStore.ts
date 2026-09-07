'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { LoginInputSchema, SignupInputSchema } from '@/schemas/inputSchemas';
import { recordAuthFailure, recordAuthSuccess } from '@/lib/security/rateLimiter';
import { formatSafeUserError } from '@/lib/utils/errorHandler';

export type UserRole = 'learner' | 'admin' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  preferredLanguage: string;
  learningModality: string;
  createdAt?: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initializeAuth: () => () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    role?: UserRole;
    preferredLanguage?: string;
    learningModality?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
}

// Module-level singleton state for auth subscription to prevent redundant listener registrations
let isAuthInitialized = false;
let globalSubscription: { unsubscribe: () => void } | null = null;

function areUserProfilesEqual(
  existing: UserProfile | null,
  next: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    avatarUrl?: string | null;
    preferredLanguage: string;
    learningModality: string;
  }
): boolean {
  if (!existing) return false;
  return (
    existing.id === next.id &&
    existing.email === next.email &&
    existing.fullName === next.fullName &&
    existing.role === next.role &&
    existing.avatarUrl === next.avatarUrl &&
    existing.preferredLanguage === next.preferredLanguage &&
    existing.learningModality === next.learningModality
  );
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start true so initial render doesn't prematurely trigger unauthenticated redirects
  error: null,

  initializeAuth: () => {
    // If already initialized globally, do not recreate listener or re-run duplicate fetches
    if (isAuthInitialized) {
      return () => {};
    }
    isAuthInitialized = true;

    // 1. Fetch current session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error || !session?.user) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Fetch profile from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      const candidateUser: UserProfile = profile
        ? {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            role: (profile.role as UserRole) || 'student',
            avatarUrl:
              profile.avatar_url ||
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture ||
              null,
            preferredLanguage: profile.preferred_language || 'English',
            learningModality: profile.learning_modality || 'mixed',
            createdAt: profile.created_at,
          }
        : {
            id: session.user.id,
            email: session.user.email || '',
            fullName:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              'Learner',
            role: (session.user.user_metadata?.role as UserRole) || 'student',
            avatarUrl:
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture ||
              null,
            preferredLanguage: 'English',
            learningModality: 'mixed',
          };

      const currentUser = get().user;
      if (currentUser && areUserProfilesEqual(currentUser, candidateUser)) {
        // Retain stable object reference to prevent triggering downstream useEffects
        if (get().isLoading || !get().isAuthenticated) {
          set({ isAuthenticated: true, isLoading: false });
        }
      } else {
        set({
          user: candidateUser,
          isAuthenticated: true,
          isLoading: false,
        });
      }
    });

    // 2. Listen to auth changes (single global listener)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const candidateUser: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          fullName:
            profile?.full_name ||
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            'Learner',
          role: (profile?.role as UserRole) || (session.user.user_metadata?.role as UserRole) || 'student',
          avatarUrl:
            profile?.avatar_url ||
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            null,
          preferredLanguage: profile?.preferred_language || 'English',
          learningModality: profile?.learning_modality || 'mixed',
          createdAt: profile?.created_at,
        };

        const currentUser = get().user;
        if (currentUser && areUserProfilesEqual(currentUser, candidateUser)) {
          // Do not update object reference if unchanged — keeps component trees stable
          if (get().isLoading || !get().isAuthenticated) {
            set({ isAuthenticated: true, isLoading: false });
          }
        } else {
          set({
            user: candidateUser,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    globalSubscription = subscription;

    return () => {
      // Keep global subscription alive across component unmounts
    };
  },

  signIn: async (email, password) => {
    // 1. Strict input validation
    const validation = LoginInputSchema.safeParse({ email, password });
    if (!validation.success) {
      const msg = validation.error.issues[0]?.message || 'Invalid email or password format.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) {
        recordAuthFailure({ clientIp: 'client', accountEmail: validation.data.email });
        const safeMsg = formatSafeUserError(error);
        set({ isLoading: false, error: safeMsg });
        return { success: false, error: safeMsg };
      }

      recordAuthSuccess({ clientIp: 'client', accountEmail: validation.data.email });

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            fullName: profile?.full_name || data.user.user_metadata?.full_name || 'Learner',
            role: (profile?.role as UserRole) || (data.user.user_metadata?.role as UserRole) || 'student',
            avatarUrl: profile?.avatar_url || null,
            preferredLanguage: profile?.preferred_language || 'English',
            learningModality: profile?.learning_modality || 'mixed',
            createdAt: profile?.created_at,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      }

      return { success: true };
    } catch (err: any) {
      const safeMsg = formatSafeUserError(err);
      set({ isLoading: false, error: safeMsg });
      return { success: false, error: safeMsg };
    }
  },

  signUp: async (params) => {
    // 1. Strict input validation
    const validation = SignupInputSchema.safeParse(params);
    if (!validation.success) {
      const msg = validation.error.issues[0]?.message || 'Invalid registration details.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          data: {
            full_name: validation.data.fullName,
            role: validation.data.role,
          },
        },
      });

      if (error) {
        const safeMsg = formatSafeUserError(error);
        set({ isLoading: false, error: safeMsg });
        return { success: false, error: safeMsg };
      }

      if (data.user) {
        // Upsert into profiles table
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: validation.data.email,
          full_name: validation.data.fullName,
          role: validation.data.role || 'learner',
          preferred_language: validation.data.preferredLanguage || 'English',
          learning_modality: validation.data.learningModality || 'mixed',
        });

        set({
          user: {
            id: data.user.id,
            email: validation.data.email,
            fullName: validation.data.fullName,
            role: validation.data.role || 'learner',
            preferredLanguage: validation.data.preferredLanguage || 'English',
            learningModality: validation.data.learningModality || 'mixed',
          },
          isAuthenticated: true,
          isLoading: false,
        });
      }

      return { success: true };
    } catch (err: any) {
      const safeMsg = formatSafeUserError(err);
      set({ isLoading: false, error: safeMsg });
      return { success: false, error: safeMsg };
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },

  updateProfile: async (updates) => {
    const currentUser = get().user;
    if (!currentUser) return { success: false, error: 'Not authenticated' };

    try {
      const updatePayload: any = {};
      if (updates.fullName) updatePayload.full_name = updates.fullName;
      if (updates.preferredLanguage) updatePayload.preferred_language = updates.preferredLanguage;
      if (updates.learningModality) updatePayload.learning_modality = updates.learningModality;

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', currentUser.id);

      if (error) return { success: false, error: error.message };

      set({
        user: {
          ...currentUser,
          ...updates,
        },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
}));
