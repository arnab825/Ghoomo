'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateGoalIntakeBlueprintAction } from '@/app/actions/aiActions';
import { validateAndRepairConceptDAG } from '@/lib/engine/graphValidator';
import { createGoal, createJourney, saveConceptsAndPrerequisites } from '@/lib/services/journeyDbService';
import { initializeDiagnosticStates } from '@/lib/services/learnerStateDbService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { CandidateDiagnosticQuestion, CandidateConceptNode } from '@/lib/ai/schemas';
import { Compass, Sparkles, CheckCircle2, ArrowRight, Loader2, Target, Brain } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function GoalWizardModal() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isGoalWizardOpen, setGoalWizardOpen } = useUIStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [goalTitle, setGoalTitle] = useState('');
  const [targetDomain, setTargetDomain] = useState('Computer Science');
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [learningModality, setLearningModality] = useState('practice');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Intake & Diagnostic states
  const [candidateNodes, setCandidateNodes] = useState<CandidateConceptNode[]>([]);
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<CandidateDiagnosticQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [practiceDrills, setPracticeDrills] = useState<any[]>([]);

  const handleStartDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingMessage('Designing your personalized learning roadmap...');

    try {
      // 1. Single-call batch blueprint generation via secure Server Action
      const blueprintRes = await generateGoalIntakeBlueprintAction({
        goalTitle: goalTitle.trim(),
        targetDomain,
        preferredModality: learningModality,
      });

      if (!blueprintRes.success) {
        setErrorMessage(blueprintRes.error || 'Failed to extract concepts for this goal.');
        setIsLoading(false);
        return;
      }

      setCandidateNodes(blueprintRes.data.concepts);
      setDiagnosticQuestions(blueprintRes.data.diagnosticQuestions);
      setPracticeDrills(blueprintRes.data.practiceDrills);
      setStep(3); // Go to diagnostic step
    } catch (err: any) {
      setErrorMessage(err.message || 'Error initializing diagnostic.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteDiagnosticAndBuild = async () => {
    if (!user) {
      setErrorMessage('You must be signed in to create a journey.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingMessage('Organizing topics into the best learning order...');

    try {
      // 1. Validate candidate DAG deterministically
      const validatedDAG = validateAndRepairConceptDAG(candidateNodes);
      if (!validatedDAG.isValid) {
        setErrorMessage('Could not produce a valid prerequisite sequence. Please try a more specific goal.');
        setIsLoading(false);
        return;
      }

      setLoadingMessage('Setting up your learning journey...');

      // 2. Persist goal
      const goalRes = await createGoal({
        userId: user.id,
        title: goalTitle.trim(),
        targetDomain,
        dailyMinutes,
      });

      if (!goalRes.data) {
        setErrorMessage(goalRes.error || 'Failed to save goal.');
        setIsLoading(false);
        return;
      }

      // 3. Persist journey
      const journeyRes = await createJourney({
        creatorId: user.id,
        goalId: goalRes.data.id,
        title: goalTitle.trim(),
        description: `Personalized adaptive learning route for ${goalTitle.trim()}`,
        subject: targetDomain,
        baselineActivityCount: validatedDAG.nodes.length * 2,
      });

      if (!journeyRes.data) {
        setErrorMessage(journeyRes.error || 'Failed to create journey.');
        setIsLoading(false);
        return;
      }

      const journeyId = journeyRes.data.id;

      // 4. Save concepts & verified DAG prerequisites
      const saveRes = await saveConceptsAndPrerequisites({
        journeyId,
        nodes: validatedDAG.nodes,
        edges: validatedDAG.edges,
      });

      if (!saveRes.success) {
        setErrorMessage(saveRes.error || 'Failed to save concept topology.');
        setIsLoading(false);
        return;
      }

      // 5. Evaluate diagnostic answers and initialize epistemic state
      const conceptIdToIsCorrect = new Map<string, boolean>();
      diagnosticQuestions.forEach((q, idx) => {
        const selected = userAnswers[idx];
        const isCorrect = selected === q.correctAnswer;
        const conceptId = saveRes.conceptMap.get(q.conceptSlug);
        if (conceptId) {
          conceptIdToIsCorrect.set(conceptId, isCorrect);
        }
      });

      // Also set any unassessed concepts to false/unknown
      for (const node of validatedDAG.nodes) {
        const conceptId = saveRes.conceptMap.get(node.slug);
        if (conceptId && !conceptIdToIsCorrect.has(conceptId)) {
          conceptIdToIsCorrect.set(conceptId, false);
        }
      }

      setLoadingMessage('Preparing your interactive practice questions...');
      await initializeDiagnosticStates({
        userId: user.id,
        conceptIdToIsCorrect,
      });

      // 6. Create activities with attached question records & resources
      const activitiesToInsert = validatedDAG.nodes.map((node, index) => {
        const conceptId = saveRes.conceptMap.get(node.slug)!;
        const matchingDrill = practiceDrills.find((d) => d.conceptSlug === node.slug);

        return {
          journey_id: journeyId,
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

      if (actErr) {
        console.warn('Activity insertion issue:', actErr.message);
      }

      // 7. Persist interactive progressive question records attached to inserted activities
      if (insertedActivities && insertedActivities.length > 0) {
        const questionsToInsert: any[] = [];

        insertedActivities.forEach((act) => {
          // Find matching concept slug
          const node = validatedDAG.nodes.find((n) => saveRes.conceptMap.get(n.slug) === act.concept_id);
          const drill = practiceDrills.find((d) => d.conceptSlug === node?.slug);

          if (drill) {
            if (drill.questions && drill.questions.length > 0) {
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
            } else if (drill.questionText && drill.options && drill.correctAnswer) {
              questionsToInsert.push({
                activity_id: act.id,
                concept_id: act.concept_id,
                question: drill.questionText,
                question_type: 'mcq',
                options: drill.options,
                correct_answer: drill.correctAnswer,
                explanation: drill.explanation || 'Correct solution verification.',
                order_index: 0,
              });
            }
          }
        });

        if (questionsToInsert.length > 0) {
          await supabase.from('questions').insert(questionsToInsert);
        }
      }

      // Close modal and navigate directly to navigation app
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ghoomo:roadmap-updated'));
      }
      setGoalWizardOpen(false);
      setStep(1);
      setGoalTitle('');
      setUserAnswers({});
      router.push('/app');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating learning route.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isGoalWizardOpen} onOpenChange={setGoalWizardOpen}>
      <DialogContent className="max-w-2xl p-6 sm:p-8">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Compass size={16} />
            <span>Create Your Learning Path</span>
          </div>
          <DialogTitle className="text-2xl font-bold font-heading">
            {step === 1 && 'What do you want to learn?'}
            {step === 2 && 'How & When You Learn'}
            {step === 3 && 'Quick Skill Check (5 Questions)'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {step === 1 && 'Tell us your learning goal. We will map out the steps and helpful foundations.'}
            {step === 2 && 'Choose how you like to learn and how much time you have each day.'}
            {step === 3 && 'Answer 5 quick questions so we can skip what you already know and get you straight to new topics.'}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Building Your Personalized Roadmap
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {loadingMessage}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* STEP 1: Goal Input */}
            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    What is your learning goal?
                  </label>
                  <Input
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g. Build my first machine learning classifier"
                    required
                    className="h-11 text-sm"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Build my first ML classifier', 'Learn Python Data Structures', 'Understand Quantum Computing Basics'].map((ex) => (
                      <button
                        type="button"
                        key={ex}
                        onClick={() => setGoalTitle(ex)}
                        className="text-2xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Subject Domain
                  </label>
                  <select
                    value={targetDomain}
                    onChange={(e) => setTargetDomain(e.target.value)}
                    className="w-full h-11 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Computer Science">Computer Science & AI</option>
                    <option value="Mathematics">Mathematics & Statistics</option>
                    <option value="Physics">Physics & Engineering</option>
                    <option value="Data Science">Data Science</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={!goalTitle.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                    <span>Next: Learning Style</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 2: Modality & Daily Minutes */}
            {step === 2 && (
              <form onSubmit={handleStartDiagnostic} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    How do you like to learn?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'practice', label: 'Practice & Quizzes' },
                      { id: 'visual', label: 'Visual & Diagrams' },
                      { id: 'explain', label: 'Step-by-Step' },
                      { id: 'project', label: 'Hands-on Projects' },
                    ].map((mod) => (
                      <button
                        type="button"
                        key={mod.id}
                        onClick={() => setLearningModality(mod.id)}
                        className={`p-3 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                          learningModality === mod.id
                            ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold shadow-2xs'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {mod.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Daily Time Commitment
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[15, 30, 60].map((mins) => (
                      <button
                        type="button"
                        key={mins}
                        onClick={() => setDailyMinutes(mins)}
                        className={`p-3 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                          dailyMinutes === mins
                            ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold shadow-2xs'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {mins} minutes / day
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-xl">
                    Back
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                    <span>Start Quick Skill Check</span>
                    <Sparkles size={16} />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 3: 5-Item Diagnostic */}
            {step === 3 && (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900 leading-relaxed">
                  Answer what you know. Correct answers will be marked <strong>Ready</strong> so we can skip introductory lessons and save you time.
                </div>

                {diagnosticQuestions.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {qIndex + 1}. {q.question}
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            userAnswers[qIndex] === opt
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 font-medium text-indigo-950 dark:text-indigo-200'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`diagnostic-q-${qIndex}`}
                            value={opt}
                            checked={userAnswers[qIndex] === opt}
                            onChange={() => setUserAnswers({ ...userAnswers, [qIndex]: opt })}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {Object.keys(userAnswers).length} of {diagnosticQuestions.length} answered
                  </span>
                  <Button
                    onClick={handleCompleteDiagnosticAndBuild}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
                  >
                    <span>Create My Learning Roadmap</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
