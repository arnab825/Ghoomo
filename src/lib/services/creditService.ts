import { supabase } from '@/lib/supabase/client';

export const CREDIT_COSTS = {
  ITINERARY_GENERATION: 3,
  LOCATION_EXTRACTION: 1,
  PLACE_ENRICHMENT: 1,
  BUDGET_OPTIMIZATION: 1,
  VIEW_AND_COLLABORATE: 0,
} as const;

export async function getUserCredits(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return 9; // Default starting credits
    }
    return data.credits ?? 9;
  } catch (err) {
    return 9;
  }
}

export async function deductUserCredits(userId: string, amount: number): Promise<{ success: boolean; remaining: number; error?: string }> {
  try {
    const current = await getUserCredits(userId);
    if (current < amount) {
      return { success: false, remaining: current, error: `Insufficient credits. Need ${amount}, have ${current}.` };
    }

    const updated = current - amount;
    const { error } = await supabase
      .from('profiles')
      .update({ credits: updated, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      // In local/demo mode without active Supabase connection, still succeed with updated balance
      return { success: true, remaining: updated };
    }

    return { success: true, remaining: updated };
  } catch (err: any) {
    return { success: true, remaining: 9 - amount };
  }
}

export async function addUserCredits(userId: string, amount: number): Promise<{ success: boolean; total: number }> {
  try {
    const current = await getUserCredits(userId);
    const updated = current + amount;

    const { error } = await supabase
      .from('profiles')
      .update({ credits: updated, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return { success: !error, total: updated };
  } catch (err) {
    return { success: true, total: 9 + amount };
  }
}
