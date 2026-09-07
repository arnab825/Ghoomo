'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ArrowLeft, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { generateGoalIntakeBlueprintAction } from '@/app/actions/aiActions';
import { validateAndRepairConceptDAG } from '@/lib/engine/graphValidator';
import { saveConceptsAndPrerequisites } from '@/lib/services/journeyDbService';

export default function CourseRedirectPage({
  params,
}: {
  params: Promise<{ goalId: string }>;
}) {
  const resolvedParams = use(params);
  const goalId = resolvedParams.goalId;
  const router = useRouter();
  const { user } = useAuthStore();

  const [statusMessage, setStatusMessage] = useState('Finding your next lesson...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !goalId) return;
    let isMounted = true;

    async function resolveCourseActivity() {
      try {
        // 1. Fetch goal
        const { data: goal, error: goalErr } = await supabase
          .from('learning_goals')
          .select('*')
          .eq('id', goalId)
          .single();

        if (goalErr || !goal) {
          throw new Error('Course goal not found.');
        }

        // 2. Fetch journey
        const { data: journey } = await supabase
          .from('learning_journeys')
          .select('*')
          .eq('goal_id', goalId)
          .maybeSingle();

        if (journey) {
          // 3. Fetch activities for journey
          const { data: activities } = await supabase
            .from('learning_activities')
            .select('*')
            .eq('journey_id', journey.id)
            .order('order_index', { ascending: true });

          if (activities && activities.length > 0) {
            // Check learner states to find first unmastered
            const { data: states } = await supabase
              .from('learner_concept_state')
              .select('*')
              .eq('user_id', user!.id);

            const masteredSet = new Set(
              (states || [])
                .filter((s) => s.state === 'MASTERED')
                .map((s) => s.concept_id)
            );

            const nextAct = activities.find((a) => !masteredSet.has(a.concept_id)) || activities[0];

            if (isMounted) {
              router.replace(`/app/learn/${nextAct.id}`);
            }
            return;
          }
        }

        // 4. If journey or activities are missing, generate roadmap now
        if (!isMounted) return;
        setStatusMessage('Setting up your interactive lessons & practice questions...');

        const blueprintRes = await generateGoalIntakeBlueprintAction({
          goalTitle: goal.title,
          targetDomain: goal.target_domain,
          preferredModality: user!.learningModality || 'textual',
        });

        if (!blueprintRes.success || !blueprintRes.data) {
          throw new Error((blueprintRes as any).error || 'Failed to design lessons for this course.');
        }

        const validatedDAG = validateAndRepairConceptDAG(blueprintRes.data.concepts);

        // Create journey if missing
        let jId = journey?.id;
        if (!jId) {
          const { data: newJourney, error: jErr } = await supabase
            .from('learning_journeys')
            .insert({
              creator_id: user!.id,
              goal_id: goal.id,
              title: goal.title,
              description: `Personalized study path for ${goal.title}`,
              subject: goal.target_domain,
              difficulty: 'intermediate',
              status: 'active',
              baseline_activity_count: validatedDAG.nodes.length * 2,
              readiness_score: 50,
            })
            .select()
            .single();

          if (jErr || !newJourney) {
            throw new Error(jErr?.message || 'Failed to create journey record.');
          }
          jId = newJourney.id;
        }

        // Save concepts
        const saveRes = await saveConceptsAndPrerequisites({
          journeyId: jId,
          nodes: validatedDAG.nodes,
          edges: validatedDAG.edges,
        });

        if (!saveRes.success) {
          throw new Error(saveRes.error || 'Failed to save course concepts.');
        }

        // Insert activities
        const practiceDrills = blueprintRes.data.practiceDrills || [];
        const activitiesToInsert = validatedDAG.nodes.map((node, index) => {
          const conceptId = saveRes.conceptMap.get(node.slug)!;
          const matchingDrill = practiceDrills.find((d: any) => d.conceptSlug === node.slug);

          return {
            journey_id: jId,
            concept_id: conceptId,
            type: matchingDrill?.activityType || (index === 0 ? 'EXPLAIN' : 'PRACTICE'),
            title: matchingDrill?.activityTitle || `Practice: ${node.name}`,
            description: matchingDrill?.activityDescription || node.description,
            instructions: matchingDrill?.instructions || `Complete the targeted practice drills to demonstrate proficiency in ${node.name}.`,
            hints: matchingDrill?.resources || [],
            duration_minutes: matchingDrill?.durationMinutes || 10,
            is_remediation: false,
            order_index: index,
          };
        });

        const { data: insertedActivities, error: actErr } = await supabase
          .from('learning_activities')
          .insert(activitiesToInsert)
          .select();

        if (actErr || !insertedActivities || insertedActivities.length === 0) {
          throw new Error(actErr?.message || 'Failed to create activities.');
        }

        // Insert questions
        const questionsToInsert: any[] = [];
        insertedActivities.forEach((act) => {
          const node = validatedDAG.nodes.find((n) => saveRes.conceptMap.get(n.slug) === act.concept_id);
          const drill = practiceDrills.find((d: any) => d.conceptSlug === node?.slug);

          if (drill?.questions && drill.questions.length > 0) {
            drill.questions.forEach((q: any, qIdx: number) => {
              questionsToInsert.push({
                activity_id: act.id,
                concept_id: act.concept_id,
                question: q.question,
                question_type: 'mcq',
                options: q.options,
                correct_answer: q.correctAnswer,
                explanation: q.explanation,
                order_index: qIdx,
              });
            });
          }
        });

        if (questionsToInsert.length > 0) {
          await supabase.from('questions').insert(questionsToInsert);
        }

        if (isMounted) {
          router.replace(`/app/learn/${insertedActivities[0].id}`);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An unexpected error occurred.');
        }
      }
    }

    resolveCourseActivity();
    return () => {
      isMounted = false;
    };
  }, [user, goalId, router]);

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
        <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 flex items-center justify-center">
          <AlertCircle size={24} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Could not open course
          </h2>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
        <Button
          onClick={() => router.push('/app/goals')}
          variant="outline"
          className="text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to My Courses</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center p-6">
      <Loader2 size={36} className="animate-spin text-indigo-600" />
      <div className="space-y-1">
        <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
          {statusMessage}
        </h2>
        <p className="text-xs text-slate-400">
          Preparing your lessons and practice drills...
        </p>
      </div>
    </div>
  );
}
