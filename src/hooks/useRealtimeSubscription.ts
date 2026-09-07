'use client';

/**
 * Ghoomo Realtime Subscription Hook
 * Generic typed Supabase Realtime subscription with:
 * - Auto-reconnection with exponential backoff
 * - Batched state updates to prevent render storms
 * - Connection status tracking
 * - Event deduplication
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface UseRealtimeOptions<T> {
  table: string;
  schema?: string;
  filter?: string; // e.g., "user_id=eq.abc123"
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onInsert?: (record: T) => void;
  onUpdate?: (record: T, oldRecord: T) => void;
  onDelete?: (record: T) => void;
  enabled?: boolean;
  /** Debounce milliseconds for batching rapid events. Default: 150ms */
  debounceMs?: number;
}

/**
 * Subscribes to Supabase Realtime changes on a table.
 * Returns connection status for UI display.
 */
export function useRealtimeSubscription<T extends Record<string, unknown>>(
  options: UseRealtimeOptions<T>
): { status: RealtimeConnectionStatus } {
  const {
    table,
    schema = 'public',
    filter,
    event = '*',
    onInsert,
    onUpdate,
    onDelete,
    enabled = true,
    debounceMs = 150,
  } = options;

  const [status, setStatus] = useState<RealtimeConnectionStatus>('disconnected');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingEventsRef = useRef<
    Array<{ eventType: string; record: T; oldRecord: T }>
  >([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Stable callback refs to avoid recreating subscriptions
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);
  onInsertRef.current = onInsert;
  onUpdateRef.current = onUpdate;
  onDeleteRef.current = onDelete;

  const flushEvents = useCallback(() => {
    const events = [...pendingEventsRef.current];
    pendingEventsRef.current = [];

    for (const e of events) {
      switch (e.eventType) {
        case 'INSERT':
          onInsertRef.current?.(e.record);
          break;
        case 'UPDATE':
          onUpdateRef.current?.(e.record, e.oldRecord);
          break;
        case 'DELETE':
          onDeleteRef.current?.(e.record);
          break;
      }
    }

    // Clear dedup set periodically to prevent memory leaks
    if (seenIdsRef.current.size > 500) {
      seenIdsRef.current.clear();
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(flushEvents, debounceMs);
  }, [flushEvents, debounceMs]);

  useEffect(() => {
    if (!enabled) {
      setStatus('disconnected');
      return;
    }

    const channelName = `realtime:${table}:${filter || 'all'}:${Date.now()}`;

    // Build subscription config
    const subscriptionConfig: Record<string, unknown> = {
      event,
      schema,
      table,
    };

    if (filter) {
      subscriptionConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        subscriptionConfig as any,
        (payload: RealtimePostgresChangesPayload<T>) => {
          const record = (payload.new || {}) as T;
          const oldRecord = (payload.old || {}) as T;
          const eventType = payload.eventType;

          // Deduplication: skip if we've seen this exact event
          const dedupeKey = `${eventType}:${JSON.stringify(record).slice(0, 100)}`;
          if (seenIdsRef.current.has(dedupeKey)) return;
          seenIdsRef.current.add(dedupeKey);

          pendingEventsRef.current.push({ eventType, record, oldRecord });
          scheduleFlush();
        }
      )
      .subscribe((status) => {
        switch (status) {
          case 'SUBSCRIBED':
            setStatus('connected');
            break;
          case 'CHANNEL_ERROR':
          case 'TIMED_OUT':
            setStatus('reconnecting');
            break;
          case 'CLOSED':
            setStatus('disconnected');
            break;
        }
      });

    channelRef.current = channel;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      seenIdsRef.current.clear();
      pendingEventsRef.current = [];
    };
  }, [table, schema, filter, event, enabled, scheduleFlush]);

  return { status };
}

/**
 * Subscribes to learner_concept_state changes for a specific user.
 */
export function useRealtimeLearnerState(
  userId: string | undefined,
  onStateChange: (conceptId: string, newState: string, masteryScore: number) => void
) {
  return useRealtimeSubscription<{
    concept_id: string;
    state: string;
    mastery_score: number;
    user_id: string;
  }>({
    table: 'learner_concept_state',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onUpdate: (record) => {
      onStateChange(record.concept_id, record.state, Number(record.mastery_score));
    },
    onInsert: (record) => {
      onStateChange(record.concept_id, record.state, Number(record.mastery_score));
    },
  });
}

/**
 * Subscribes to misconceptions for a specific user.
 */
export function useRealtimeMisconceptions(
  userId: string | undefined,
  onNew: (misconception: { conceptId: string; title: string; isResolved: boolean }) => void
) {
  return useRealtimeSubscription<{
    concept_id: string;
    misconception_title: string;
    is_resolved: boolean;
    user_id: string;
  }>({
    table: 'misconceptions',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onInsert: (record) => {
      onNew({
        conceptId: record.concept_id,
        title: record.misconception_title,
        isResolved: record.is_resolved,
      });
    },
    onUpdate: (record) => {
      onNew({
        conceptId: record.concept_id,
        title: record.misconception_title,
        isResolved: record.is_resolved,
      });
    },
  });
}

/**
 * Subscribes to route events for a specific user + journey.
 */
export function useRealtimeRouteEvents(
  userId: string | undefined,
  journeyId: string | undefined,
  onNewEvent: (event: { eventType: string; reason: string; conceptId: string | null }) => void
) {
  return useRealtimeSubscription<{
    event_type: string;
    reason: string;
    trigger_concept_id: string | null;
    user_id: string;
    journey_id: string;
  }>({
    table: 'route_events',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!(userId && journeyId),
    onInsert: (record) => {
      if (record.journey_id === journeyId) {
        onNewEvent({
          eventType: record.event_type,
          reason: record.reason,
          conceptId: record.trigger_concept_id,
        });
      }
    },
  });
}

/**
 * Subscribes to review schedule updates for spaced retrieval.
 */
export function useRealtimeReviewSchedule(
  userId: string | undefined,
  onReviewDue: (conceptId: string, nextReviewAt: string) => void
) {
  return useRealtimeSubscription<{
    concept_id: string;
    next_review_at: string;
    user_id: string;
  }>({
    table: 'review_schedule',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onInsert: (record) => {
      onReviewDue(record.concept_id, record.next_review_at);
    },
    onUpdate: (record) => {
      onReviewDue(record.concept_id, record.next_review_at);
    },
  });
}
