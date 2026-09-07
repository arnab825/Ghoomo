'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
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
import {
  Compass,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Target,
  Brain,
  Code2,
  Check,
  HelpCircle,
  Briefcase,
  Terminal,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const CS_GOAL_PRESETS = [
  'Python Data Structures & Algorithms',
  'Full Stack Development with Next.js & TypeScript',
  'AI Engineering: LLMs, RAG & Agents',
  'Operating Systems, Concurrency & Low-Level C',
  'System Design & Distributed Backends',
  'Relational Databases & SQL Query Optimization',
];

const REASON_OPTIONS = [
  { id: 'interview', label: 'Software Engineering Interviews' },
  { id: 'college', label: 'College / Academic Coursework' },
  { id: 'competitive', label: 'Competitive Programming' },
  { id: 'projects', label: 'Building Production Projects' },
  { id: 'transition', label: 'Career Transition into Tech' },
  { id: 'fundamentals', label: 'Deepening Core Fundamentals' },
];

const TARGET_PRESETS = [
  'Solve medium & hard problems confidently',
  'Build and deploy production-ready applications',
  'Master system architecture and performance tradeoffs',
  'Become comfortable writing and debugging clean code',
];

type DeclaredLevel = 'beginner' | 'intermediate' | 'advanced' | 'not_sure';

const LEVEL_OPTIONS: { id: DeclaredLevel; title: string; desc: string }[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    desc: 'New to the subject. Need guided explanations, code tracing, and core concepts.',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    desc: 'Write code regularly. Ready for implementation, complexity analysis, and debugging.',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    desc: 'Experienced engineer. Focus on subtle edge cases, architectural tradeoffs, and scale.',
  },
  {
    id: 'not_sure',
    title: 'Not sure',
    desc: 'Calibrate my baseline with a mixed diagnostic spanning easy to advanced questions.',
  },
];

export default function GoalWizardModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { isGoalWizardOpen, setGoalWizardOpen } = useUIStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goalTitle, setGoalTitle] = useState('');
  const [learningReason, setLearningReason] = useState('Software Engineering Interviews');
  const [targetCompetency, setTargetCompetency] = useState('Solve medium & hard problems confidently');
  const [declaredLevel, setDeclaredLevel] = useState<DeclaredLevel>('intermediate');

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
      const blueprintRes = await generateGoalIntakeBlueprintAction({
        goalTitle: goalTitle.trim(),
        targetDomain: 'Computer Science',
        learningReason,
        targetCompetency,
        declaredLevel,
      });

      if (!blueprintRes.success) {
        setErrorMessage(blueprintRes.error || 'Failed to design roadmap for this goal.');
        setIsLoading(false);
        return;
      }

      setCandidateNodes(blueprintRes.data.concepts);
      setDiagnosticQuestions(blueprintRes.data.diagnosticQuestions);
      setPracticeDrills(blueprintRes.data.practiceDrills);
      setStep(3); // Move to starting diagnostic check
    } catch (err: any) {
      setErrorMessage(err.message || 'Error initializing diagnostic.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteDiagnosticAndBuild = async () => {
    if (!user) {
      setErrorMessage('You must be signed in to create a roadmap.');
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
        targetDomain: 'Computer Science',
        dailyMinutes: 30,
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
        subject: 'Computer Science',
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

      setLoadingMessage('Preparing your interactive practice challenges...');
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
          instructions: matchingDrill?.instructions || `Solve the challenge to demonstrate mastery in ${node.name}.`,
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

      // 7. Persist interactive question records attached to inserted activities
      if (insertedActivities && insertedActivities.length > 0) {
        const questionsToInsert: any[] = [];

        insertedActivities.forEach((act) => {
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

      // Invalidate all related TanStack Query caches so UI updates immediately
      await queryClient.invalidateQueries({ queryKey: ['learning-map'] });
      await queryClient.invalidateQueries({ queryKey: ['goals'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      // Realtime notification & navigation
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ghoomo:roadmap-updated'));
      }
      setGoalWizardOpen(false);
      setStep(1);
      setGoalTitle('');
      setUserAnswers({});
      router.push('/app/knowledge');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating learning roadmap.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isGoalWizardOpen} onOpenChange={setGoalWizardOpen}>
      <DialogContent className="max-w-2xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2 text-saffron-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Compass size={16} />
            <span>Learning Roadmap Setup</span>
          </div>
          <DialogTitle className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
            {step === 1 && 'What do you want to learn?'}
            {step === 2 && 'Your Goals & Starting Level'}
            {step === 3 && 'Starting Check (5 Questions)'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {step === 1 && 'Choose or enter your Computer Science destination. We will map out all topics and dependencies.'}
            {step === 2 && 'Tell us your focus and self-reported level so we can calibrate your diagnostic.'}
            {step === 3 && 'A quick level-aware check to identify what you already know and highlight what you need next.'}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-saffron-500" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Building Your Engineering Roadmap
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {loadingMessage}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* STEP 1: What do you want to learn? */}
            {step === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (goalTitle.trim()) setStep(2);
                }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Learning Goal (Computer Science &amp; Software Engineering)
                  </label>
                  <Input
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g. Python Data Structures & Algorithms"
                    required
                    className="h-11 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-saffron-500"
                  />

                  <div className="mt-3">
                    <span className="text-3xs uppercase font-bold text-slate-400 block mb-2">
                      Popular Roadmaps
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {CS_GOAL_PRESETS.map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setGoalTitle(preset)}
                          className={`text-2xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            goalTitle === preset
                              ? 'bg-saffron-500/15 border-saffron-500 text-saffron-600 dark:text-saffron-400 font-semibold'
                              : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={!goalTitle.trim()}
                    className="bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next: Target &amp; Level</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 2: Why are you learning it? + Target + Current Level */}
            {step === 2 && (
              <form onSubmit={handleStartDiagnostic} className="space-y-5">
                {/* Motivation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-saffron-500" />
                    <span>Why are you learning this?</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {REASON_OPTIONS.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setLearningReason(opt.label)}
                        className={`p-2.5 text-xs rounded-xl border text-left transition-all cursor-pointer ${
                          learningReason === opt.label
                            ? 'border-saffron-500 bg-saffron-500/10 text-saffron-600 dark:text-saffron-400 font-semibold shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Competency */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Target size={14} className="text-saffron-500" />
                    <span>What is your target?</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TARGET_PRESETS.map((tgt, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setTargetCompetency(tgt)}
                        className={`p-2.5 text-xs rounded-xl border text-left transition-all cursor-pointer ${
                          targetCompetency === tgt
                            ? 'border-saffron-500 bg-saffron-500/10 text-saffron-600 dark:text-saffron-400 font-semibold shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {tgt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Declared Level */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Brain size={14} className="text-saffron-500" />
                    <span>How would you describe your current level?</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {LEVEL_OPTIONS.map((lvl) => (
                      <button
                        type="button"
                        key={lvl.id}
                        onClick={() => setDeclaredLevel(lvl.id)}
                        className={`p-3 text-xs rounded-xl border text-left transition-all cursor-pointer ${
                          declaredLevel === lvl.id
                            ? 'border-saffron-500 bg-saffron-500/10 text-slate-900 dark:text-white font-semibold ring-1 ring-saffron-500/30'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>{lvl.title}</span>
                          {declaredLevel === lvl.id && (
                            <Check size={14} className="text-saffron-500" />
                          )}
                        </div>
                        <div className="text-3xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                          {lvl.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="rounded-xl cursor-pointer"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <span>Start Level-Aware Diagnostic</span>
                    <Sparkles size={16} />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 3: Level-Aware Diagnostic */}
            {step === 3 && (
              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-saffron-500/10 p-3.5 rounded-xl border border-saffron-500/20 leading-relaxed">
                  <strong>Level-calibrated check for {declaredLevel.toUpperCase()}:</strong> Answer to the best of your knowledge. This creates your baseline so you skip known concepts and get straight to your optimal next step.
                </div>

                {diagnosticQuestions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xs uppercase font-bold text-slate-400">
                        Question {qIndex + 1} of {diagnosticQuestions.length}
                      </span>
                      {q.questionType && (
                        <span className="text-3xs font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                          {q.questionType.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                      {q.question}
                    </div>

                    {q.codeSnippet && (
                      <pre className="p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
                        <code>{q.codeSnippet}</code>
                      </pre>
                    )}

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            userAnswers[qIndex] === opt
                              ? 'border-saffron-500 bg-saffron-500/10 font-medium text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`diagnostic-q-${qIndex}`}
                            value={opt}
                            checked={userAnswers[qIndex] === opt}
                            onChange={() => setUserAnswers({ ...userAnswers, [qIndex]: opt })}
                            className="text-saffron-500 focus:ring-saffron-500"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500">
                    {Object.keys(userAnswers).length} of {diagnosticQuestions.length} answered
                  </span>
                  <Button
                    onClick={handleCompleteDiagnosticAndBuild}
                    className="bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <span>Generate My Interactive Roadmap</span>
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
