'use client';

/**
 * Ghoomo Admin Business Intelligence Dashboard
 * Full platform analytics for operators/developers.
 * Monitors: users, engagement, learning outcomes, AI costs, system health.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import RealtimeStatus from '@/components/shared/RealtimeStatus';
import {
  BarChart3,
  Users,
  BookOpen,
  Brain,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock,
  Zap,
  Shield,
  Database,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  RefreshCw,
} from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  activeUsers24h: number;
  totalGoals: number;
  totalJourneys: number;
  totalConcepts: number;
  totalAttempts: number;
  totalMasteredStates: number;
  totalMisconceptions: number;
  unresolvedMisconceptions: number;
  totalEvidence: number;
  totalRouteEvents: number;
  averageMasteryRate: number;
  averageAccuracy: number;
}

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  goalsCount: number;
  masteredCount: number;
  lastActive: string;
}

interface MisconceptionHotspot {
  conceptName: string;
  count: number;
  journeyTitle: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [misconceptionHotspots, setMisconceptionHotspots] = useState<MisconceptionHotspot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Realtime: listen for new user signups
  const { status: realtimeStatus } = useRealtimeSubscription<Record<string, unknown>>({
    table: 'profiles',
    event: '*',
    enabled: !!user,
    onInsert: () => {
      // New user signed up — refresh stats
      loadData();
    },
    onUpdate: () => {
      loadData();
    },
  });

  // Realtime: listen for learner state changes
  useRealtimeSubscription<Record<string, unknown>>({
    table: 'learner_concept_state',
    event: '*',
    enabled: !!user,
    onInsert: () => loadData(),
    onUpdate: () => loadData(),
    debounceMs: 2000, // Debounce heavily for admin dashboard
  });

  // Realtime: listen for new misconceptions
  useRealtimeSubscription<Record<string, unknown>>({
    table: 'misconceptions',
    event: 'INSERT',
    enabled: !!user,
    onInsert: () => loadData(),
    debounceMs: 2000,
  });

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      // Parallel fetch all admin analytics
      const [
        profilesResult,
        goalsResult,
        journeysResult,
        conceptsResult,
        attemptsResult,
        statesResult,
        miscResult,
        evidenceResult,
        routeEventsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, role, created_at, updated_at'),
        supabase.from('learning_goals').select('id, user_id, status, created_at'),
        supabase.from('learning_journeys').select('id, creator_id, title, status, created_at'),
        supabase.from('concepts').select('id, name, journey_id'),
        supabase.from('attempts').select('id, user_id, is_correct, score, created_at'),
        supabase.from('learner_concept_state').select('id, user_id, concept_id, state, mastery_score'),
        supabase.from('misconceptions').select('id, user_id, concept_id, misconception_title, is_resolved, created_at'),
        supabase.from('evidence').select('id, user_id, concept_id, created_at'),
        supabase.from('route_events').select('id, user_id, event_type, created_at'),
      ]);

      const profiles = profilesResult.data || [];
      const goals = goalsResult.data || [];
      const journeys = journeysResult.data || [];
      const concepts = conceptsResult.data || [];
      const attempts = attemptsResult.data || [];
      const states = statesResult.data || [];
      const misconceptions = miscResult.data || [];
      const evidence = evidenceResult.data || [];
      const routeEvents = routeEventsResult.data || [];

      // Calculate 24h active users
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 86400000);
      const activeUserIds = new Set(
        attempts
          .filter((a) => new Date(a.created_at) > oneDayAgo)
          .map((a) => a.user_id)
      );

      // Mastery stats
      const masteredStates = states.filter((s) => s.state === 'MASTERED');
      const totalMasteryScore = states.reduce((sum, s) => sum + Number(s.mastery_score || 0), 0);
      const avgMastery = states.length > 0 ? Math.round(totalMasteryScore / states.length) : 0;

      // Accuracy
      const correctAttempts = attempts.filter((a) => a.is_correct);
      const avgAccuracy = attempts.length > 0 ? Math.round((correctAttempts.length / attempts.length) * 100) : 0;

      const platformStats: PlatformStats = {
        totalUsers: profiles.length,
        activeUsers24h: activeUserIds.size,
        totalGoals: goals.length,
        totalJourneys: journeys.length,
        totalConcepts: concepts.length,
        totalAttempts: attempts.length,
        totalMasteredStates: masteredStates.length,
        totalMisconceptions: misconceptions.length,
        unresolvedMisconceptions: misconceptions.filter((m) => !m.is_resolved).length,
        totalEvidence: evidence.length,
        totalRouteEvents: routeEvents.length,
        averageMasteryRate: avgMastery,
        averageAccuracy: avgAccuracy,
      };

      setStats(platformStats);

      // Build user rows
      const userGoalCounts = new Map<string, number>();
      for (const g of goals) {
        userGoalCounts.set(g.user_id, (userGoalCounts.get(g.user_id) || 0) + 1);
      }
      const userMasteryCounts = new Map<string, number>();
      for (const s of masteredStates) {
        userMasteryCounts.set(s.user_id, (userMasteryCounts.get(s.user_id) || 0) + 1);
      }
      const userLastAttempt = new Map<string, string>();
      for (const a of attempts) {
        const existing = userLastAttempt.get(a.user_id);
        if (!existing || a.created_at > existing) {
          userLastAttempt.set(a.user_id, a.created_at);
        }
      }

      const userRows: UserRow[] = profiles.map((p) => ({
        id: p.id,
        email: p.email,
        fullName: p.full_name,
        role: p.role,
        goalsCount: userGoalCounts.get(p.id) || 0,
        masteredCount: userMasteryCounts.get(p.id) || 0,
        lastActive: userLastAttempt.get(p.id) || p.updated_at || p.created_at,
      }));

      userRows.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
      setUsers(userRows);

      // Misconception hotspots: group by concept
      const miscByConceptId = new Map<string, number>();
      for (const m of misconceptions.filter((m) => !m.is_resolved)) {
        miscByConceptId.set(m.concept_id, (miscByConceptId.get(m.concept_id) || 0) + 1);
      }
      const conceptNameMap = new Map<string, string>();
      const conceptJourneyMap = new Map<string, string>();
      for (const c of concepts) {
        conceptNameMap.set(c.id, c.name);
      }
      for (const j of journeys) {
        for (const c of concepts.filter((c) => c.journey_id === j.id)) {
          conceptJourneyMap.set(c.id, j.title);
        }
      }

      const hotspots: MisconceptionHotspot[] = Array.from(miscByConceptId.entries())
        .map(([conceptId, count]) => ({
          conceptName: conceptNameMap.get(conceptId) || 'Unknown',
          count,
          journeyTitle: conceptJourneyMap.get(conceptId) || 'Unknown Journey',
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setMisconceptionHotspots(hotspots);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[Admin Dashboard] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Check admin role
    if (user.role !== 'admin') {
      router.push('/app');
      return;
    }

    loadData();
  }, [user, router, loadData]);

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.email.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">Loading platform analytics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-slate-500">Unable to load admin analytics.</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950', delta: stats.activeUsers24h, deltaLabel: 'active 24h' },
    { label: 'Learning Journeys', value: stats.totalJourneys, icon: BookOpen, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
    { label: 'Concepts Created', value: stats.totalConcepts, icon: Brain, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950' },
    { label: 'Total Attempts', value: stats.totalAttempts, icon: Activity, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950' },
    { label: 'Concepts Mastered', value: stats.totalMasteredStates, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Avg Mastery', value: `${stats.averageMasteryRate}%`, icon: Zap, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950' },
    { label: 'Avg Accuracy', value: `${stats.averageAccuracy}%`, icon: BarChart3, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
    { label: 'Unresolved Issues', value: stats.unresolvedMisconceptions, icon: AlertTriangle, color: stats.unresolvedMisconceptions > 5 ? 'text-red-600 bg-red-50 dark:bg-red-950' : 'text-amber-600 bg-amber-50 dark:bg-amber-950' },
    { label: 'Evidence Submitted', value: stats.totalEvidence, icon: Shield, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950' },
    { label: 'Route Events', value: stats.totalRouteEvents, icon: Database, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  ];

  return (
    <div className="space-y-8">
      <RealtimeStatus status={realtimeStatus} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Admin Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Platform analytics • Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => { setIsLoading(true); loadData(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-2xs font-bold
                     bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400
                     hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${card.color}`}>
                <card.icon size={16} />
              </div>
              {card.delta !== undefined && (
                <span className="flex items-center gap-0.5 text-2xs font-bold text-emerald-600">
                  <ArrowUpRight size={10} />
                  {card.delta} {card.deltaLabel}
                </span>
              )}
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white font-heading">
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </p>
              <p className="text-2xs text-slate-500 font-medium">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-Column: Users + Misconception Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">All Users</h2>
            <div className="relative flex-1 max-w-xs">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-2xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3 text-2xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="px-3 py-3 text-2xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-3 py-3 text-2xs font-bold text-slate-400 uppercase tracking-wider text-center">Goals</th>
                  <th className="px-3 py-3 text-2xs font-bold text-slate-400 uppercase tracking-wider text-center">Mastered</th>
                  <th className="px-3 py-3 text-2xs font-bold text-slate-400 uppercase tracking-wider">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.slice(0, 50).map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{u.fullName}</p>
                        <p className="text-2xs text-slate-400">{u.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                            : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{u.goalsCount}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{u.masteredCount}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-2xs text-slate-500">
                          {new Date(u.lastActive).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Misconception Hotspots */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              Misconception Hotspots
            </h2>
            <p className="text-2xs text-slate-500 mt-0.5">Most common unresolved errors across all learners</p>
          </div>

          <div className="p-3 space-y-1">
            {misconceptionHotspots.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No unresolved misconceptions</p>
            ) : (
              misconceptionHotspots.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {h.conceptName}
                    </p>
                    <p className="text-2xs text-slate-400 truncate">{h.journeyTitle}</p>
                  </div>
                  <span className="shrink-0 text-2xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                    {h.count} {h.count === 1 ? 'issue' : 'issues'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
