import { supabase } from '@/lib/supabase/client';
import { RouteEvent, RouteEventType } from '../types/engine';

export async function logRouteEvent(params: {
  userId: string;
  journeyId: string;
  triggerConceptId?: string | null;
  eventType: RouteEventType;
  reason: string;
  evidenceSummary?: string | null;
  previousAction?: string | null;
  newAction?: string | null;
}): Promise<RouteEvent | null> {
  try {
    const { data, error } = await supabase
      .from('route_events')
      .insert({
        user_id: params.userId,
        journey_id: params.journeyId,
        trigger_concept_id: params.triggerConceptId ?? null,
        event_type: params.eventType,
        reason: params.reason,
        evidence_summary: params.evidenceSummary ?? null,
        previous_action: params.previousAction ?? null,
        new_action: params.newAction ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      console.warn('Failed to log route event:', error?.message);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      journeyId: data.journey_id,
      triggerConceptId: data.trigger_concept_id,
      eventType: data.event_type as RouteEventType,
      reason: data.reason,
      evidenceSummary: data.evidence_summary,
      previousAction: data.previous_action,
      newAction: data.new_action,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('Error logging route event:', err);
    return null;
  }
}

export async function getJourneyRouteEvents(
  journeyId: string,
  userId: string
): Promise<RouteEvent[]> {
  try {
    const { data, error } = await supabase
      .from('route_events')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d) => ({
      id: d.id,
      userId: d.user_id,
      journeyId: d.journey_id,
      triggerConceptId: d.trigger_concept_id,
      eventType: d.event_type as RouteEventType,
      reason: d.reason,
      evidenceSummary: d.evidence_summary,
      previousAction: d.previous_action,
      newAction: d.new_action,
      createdAt: d.created_at,
    }));
  } catch {
    return [];
  }
}
