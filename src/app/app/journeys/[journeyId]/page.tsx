'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function JourneyRedirectPage({
  params,
}: {
  params: Promise<{ journeyId: string }>;
}) {
  const resolvedParams = use(params);
  const journeyId = resolvedParams.journeyId;
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function redirectNextActivity() {
      try {
        if (!journeyId) {
          router.replace('/app/knowledge');
          return;
        }

        // 1. Fetch activities for this journey ordered by order_index
        const { data: activities } = await supabase
          .from('learning_activities')
          .select('id, concept_id')
          .eq('journey_id', journeyId)
          .order('order_index', { ascending: true });

        if (activities && activities.length > 0) {
          // Check learner states to find first unmastered activity
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const conceptIds = activities.map((a) => a.concept_id);
            const { data: states } = await supabase
              .from('learner_concept_state')
              .select('concept_id, state, mastery_score')
              .eq('user_id', user.id)
              .in('concept_id', conceptIds);

            const masteredSet = new Set(
              (states || [])
                .filter((s) => s.state === 'MASTERED' || (s.mastery_score || 0) >= 80)
                .map((s) => s.concept_id)
            );

            const nextAct = activities.find((a) => !masteredSet.has(a.concept_id)) || activities[0];
            if (isMounted) {
              router.replace(`/app/learn/${nextAct.id}`);
              return;
            }
          } else if (isMounted) {
            router.replace(`/app/learn/${activities[0].id}`);
            return;
          }
        }

        if (isMounted) {
          router.replace('/app/knowledge');
        }
      } catch (err) {
        console.error('Journey redirect error:', err);
        if (isMounted) {
          router.replace('/app/knowledge');
        }
      }
    }

    redirectNextActivity();

    return () => {
      isMounted = false;
    };
  }, [journeyId, router]);

  return (
    <div className="min-h-55 flex flex-col items-center justify-center space-y-3 p-8">
      <Loader2 size={32} className="animate-spin text-saffron-500" />
      <p className="text-xs font-semibold text-slate-500">
        Navigating to your next learning step...
      </p>
    </div>
  );
}
