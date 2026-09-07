'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import {
  Concept,
  ConceptPrerequisite,
  LearnerConceptState,
  LearningActivity,
} from '@/lib/types/engine';
import KnowledgeGraphMap from '@/components/learning/KnowledgeGraphMap';
import { Loader2, Compass, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { useUIStore } from '@/stores/useUIStore';

export default function LearningMapPage() {
  const { user } = useAuthStore();
  const { setGoalWizardOpen } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [prerequisites, setPrerequisites] = useState<ConceptPrerequisite[]>([]);
  const [states, setStates] = useState<Map<string, LearnerConceptState>>(new Map());
  const [activities, setActivities] = useState<LearningActivity[]>([]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadLearningMapData() {
      setIsLoading(true);
      try {
        // 1. Fetch concepts
        const { data: cData } = await supabase
          .from('concepts')
          .select('*')
          .order('order_index', { ascending: true });

        // 2. Fetch prerequisites
        const { data: pData } = await supabase
          .from('concept_prerequisites')
          .select('*');

        // 3. Fetch learner states
        const { data: sData } = await supabase
          .from('learner_concept_state')
          .select('*')
          .eq('user_id', user!.id);

        // 4. Fetch learning activities
        const { data: aData } = await supabase
          .from('learning_activities')
          .select('*');

        if (!isMounted) return;

        const conceptList: Concept[] = (cData || []).map((c: any) => ({
          id: c.id,
          journeyId: c.journey_id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          domain: c.domain,
          difficulty: c.difficulty,
          masteryThreshold: c.mastery_threshold,
          orderIndex: c.order_index,
          createdAt: c.created_at,
        }));
        setConcepts(conceptList);

        const prereqList: ConceptPrerequisite[] = (pData || []).map((p: any) => ({
          conceptId: p.concept_id,
          prerequisiteConceptId: p.prerequisite_concept_id,
          strength: p.strength || 1.0,
        }));
        setPrerequisites(prereqList);

        const stateMap = new Map<string, LearnerConceptState>();
        for (const s of sData || []) {
          stateMap.set(s.concept_id, {
            id: s.id,
            userId: s.user_id,
            conceptId: s.concept_id,
            state: s.state,
            score: Number(s.mastery_score) || 0,
            confidence: Number(s.confidence_score) || 0,
            evidenceCount: s.evidence_count || 0,
            masterySource: s.mastery_source,
            evidenceSummary: s.evidence_summary,
            lastAssessedAt: s.last_assessed_at,
            updatedAt: s.updated_at,
          } as any);
        }
        setStates(stateMap);

        const activityList: LearningActivity[] = (aData || []).map((a: any) => ({
          id: a.id,
          journeyId: a.journey_id,
          conceptId: a.concept_id,
          type: a.type,
          title: a.title,
          description: a.description,
          instructions: a.instructions,
          thinkingPrompt: a.thinking_prompt,
          hints: a.hints || [],
          durationMinutes: a.duration_minutes,
          isRemediation: a.is_remediation,
          orderIndex: a.order_index,
          createdAt: a.created_at,
        }));
        setActivities(activityList);
      } catch (err) {
        console.error('Error loading Learning Map:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadLearningMapData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-saffron-500" />
        <p className="text-xs font-semibold text-slate-500">
          Loading your learning map...
        </p>
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <EmptyState
          icon={<Compass size={32} className="text-saffron-500" />}
          title="No Learning Map Yet"
          description="Create your first learning journey to explore an interactive, personalized roadmap of topics."
          actionLabel="Create Learning Goal"
          onAction={() => setGoalWizardOpen(true)}
        />
      </div>
    );
  }

  // Calculate quick stats
  let masteredCount = 0;
  let inProgressCount = 0;
  let reviewCount = 0;

  concepts.forEach((c) => {
    const s = states.get(c.id)?.state;
    if (s === 'MASTERED') masteredCount++;
    else if (s === 'NEEDS_REVIEW') reviewCount++;
    else if (s === 'DEVELOPING' || s === 'PROVISIONALLY_READY') inProgressCount++;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header & Quick Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Your Learning Map
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explore your connected roadmap. Zoom, pan, and inspect topics to learn, practice, and master.
          </p>
        </div>

        {/* Quick pill stats */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={14} />
            <span>{masteredCount} Mastered</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Clock size={14} />
            <span>{inProgressCount} In Progress</span>
          </div>
          {reviewCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-400 animate-pulse">
              <AlertCircle size={14} />
              <span>{reviewCount} To Review</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive SVG Learning Map */}
      <KnowledgeGraphMap
        concepts={concepts}
        prerequisites={prerequisites}
        learnerStates={states}
        activities={activities}
      />
    </div>
  );
}
