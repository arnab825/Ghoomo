'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import {
  Concept,
  ConceptPrerequisite,
  LearnerConceptState,
  LearningActivity,
} from '@/lib/types/engine';

export interface ActiveGoalSummary {
  id: string;
  title: string;
  targetDomain: string;
}

export interface LearningMapData {
  activeGoals: ActiveGoalSummary[];
  archivedCount: number;
  concepts: Concept[];
  prerequisites: ConceptPrerequisite[];
  states: Map<string, LearnerConceptState>;
  activities: LearningActivity[];
}

export function useLearningMapQuery(userId?: string, selectedGoalId: string = 'ALL') {
  return useQuery({
    queryKey: queryKeys.learningMap.byGoal(userId, selectedGoalId),
    placeholderData: keepPreviousData, // Keeps previous graph rendered during background refreshes
    queryFn: async (): Promise<LearningMapData> => {
      if (!userId) {
        return {
          activeGoals: [],
          archivedCount: 0,
          concepts: [],
          prerequisites: [],
          states: new Map(),
          activities: [],
        };
      }

      // 1. Fetch active goals
      const { data: goalsData } = await supabase
        .from('learning_goals')
        .select('id, title, target_domain')
        .eq('user_id', userId)
        .neq('status', 'abandoned')
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      // 2. Fetch count of archived goals
      const { count: arcCount } = await supabase
        .from('learning_goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['abandoned', 'archived']);

      const activeGoals: ActiveGoalSummary[] = (goalsData || []).map((g) => ({
        id: g.id,
        title: g.title,
        targetDomain: g.target_domain,
      }));

      if (activeGoals.length === 0) {
        return {
          activeGoals: [],
          archivedCount: arcCount || 0,
          concepts: [],
          prerequisites: [],
          states: new Map(),
          activities: [],
        };
      }

      const targetGoalId =
        selectedGoalId !== 'ALL' && activeGoals.some((g) => g.id === selectedGoalId)
          ? selectedGoalId
          : activeGoals[0]?.id;

      const targetGoalIds = targetGoalId ? [targetGoalId] : [];

      // 3. Fetch active journeys
      const { data: journeysData } = await supabase
        .from('learning_journeys')
        .select('id, goal_id, title')
        .in('goal_id', targetGoalIds)
        .neq('status', 'archived');

      const activeJourneyIds = (journeysData || []).map((j: any) => j.id);

      if (activeJourneyIds.length === 0) {
        return {
          activeGoals,
          archivedCount: arcCount || 0,
          concepts: [],
          prerequisites: [],
          states: new Map(),
          activities: [],
        };
      }

      // 4. Fetch concepts
      const { data: cData } = await supabase
        .from('concepts')
        .select('*')
        .in('journey_id', activeJourneyIds)
        .order('order_index', { ascending: true });

      const conceptNodes = cData || [];
      const conceptIds = conceptNodes.map((c: any) => c.id);

      if (conceptIds.length === 0) {
        return {
          activeGoals,
          archivedCount: arcCount || 0,
          concepts: [],
          prerequisites: [],
          states: new Map(),
          activities: [],
        };
      }

      // 5. Parallel fetch: prerequisites, learner states, activities
      const [prereqRes, stateRes, actRes] = await Promise.all([
        supabase.from('concept_prerequisites').select('*').in('concept_id', conceptIds),
        supabase.from('learner_concept_state').select('*').eq('user_id', userId).in('concept_id', conceptIds),
        supabase.from('learning_activities').select('*').in('journey_id', activeJourneyIds),
      ]);

      const concepts: Concept[] = conceptNodes.map((c: any) => ({
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

      const activeIdSet = new Set(conceptIds);
      const prerequisites: ConceptPrerequisite[] = (prereqRes.data || [])
        .filter((p: any) => activeIdSet.has(p.concept_id) && activeIdSet.has(p.prerequisite_concept_id))
        .map((p: any) => ({
          conceptId: p.concept_id,
          prerequisiteConceptId: p.prerequisite_concept_id,
          strength: p.strength || 1.0,
        }));

      const stateMap = new Map<string, LearnerConceptState>();
      for (const s of stateRes.data || []) {
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

      const activities: LearningActivity[] = (actRes.data || []).map((a: any) => ({
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

      return {
        activeGoals,
        archivedCount: arcCount || 0,
        concepts,
        prerequisites,
        states: stateMap,
        activities,
      };
    },
    enabled: !!userId,
  });
}
