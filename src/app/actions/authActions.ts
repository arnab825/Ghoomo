'use server';

import { supabase } from '@/lib/supabase/client';
import { UserRole, UserProfile } from '@/stores/useAuthStore';

interface SyncProfileParams {
  userId: string;
  email: string;
  fullName?: string;
  role?: UserRole;
  avatarUrl?: string;
}

/**
 * Backend Server Action: Syncs and persists verified user profile directly in the database.
 * No client-side storage or cookies are used.
 */
export async function syncProfileBackendAction({
  userId,
  email,
  fullName,
  role = 'student',
  avatarUrl,
}: SyncProfileParams): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required for backend profile sync.' };
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (fullName || cleanEmail.split('@')[0] || 'User').trim();
    const defaultAvatar =
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80';
    const finalAvatar = avatarUrl && avatarUrl.trim() ? avatarUrl.trim() : defaultAvatar;

    // 1. Check if profile already exists in public.profiles table
    const { data: existingProfile, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchErr) {
      console.warn('[syncProfileBackendAction] Profile query notice:', fetchErr.message);
    }

    // Determine target role (prioritize explicitly passed role, then existing record, fallback to student)
    const effectiveRole: UserRole = role || (existingProfile?.role as UserRole) || 'student';

    // 2. Upsert the profile on the backend
    const profilePayload = {
      id: userId,
      email: cleanEmail,
      full_name: existingProfile?.full_name || cleanName,
      role: effectiveRole,
      avatar_url: existingProfile?.avatar_url || finalAvatar,
      credits: existingProfile?.credits ?? 9,
    };

    const { data: upserted, error: upsertErr } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select('*')
      .single();

    if (upsertErr) {
      console.warn('[syncProfileBackendAction] Database upsert warning:', upsertErr.message);
    }

    const record = upserted || profilePayload;

    const userProfile: UserProfile = {
      id: record.id,
      email: record.email,
      fullName: record.full_name,
      name: record.full_name,
      username: record.email ? record.email.split('@')[0] : 'user',
      role: record.role as UserRole,
      avatarUrl: record.avatar_url || finalAvatar,
      credits: record.credits ?? 9,
      createdAt: record.created_at,
    };

    return { success: true, profile: userProfile };
  } catch (err: unknown) {
    console.error('[syncProfileBackendAction] Backend sync error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Backend profile synchronization failed.',
    };
  }
}

/**
 * Backend Server Action: Updates user role in database directly.
 */
export async function updateRoleBackendAction(
  userId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required.' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.warn('[updateRoleBackendAction] Update warning:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('[updateRoleBackendAction] Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update role on backend.',
    };
  }
}

/**
 * Backend Server Action: Deletes user profile directly from database.
 */
export async function deleteAccountBackendAction(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required.' };
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.warn('[deleteAccountBackendAction] Delete warning:', error.message);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('[deleteAccountBackendAction] Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete account on backend.',
    };
  }
}
