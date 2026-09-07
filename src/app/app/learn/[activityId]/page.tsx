'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import { LearningActivity, Concept, LearningQuestion, RouteDiff as RouteDiffType } from '@/lib/types/engine';
import { submitQuestionAttemptAction } from '@/app/actions/learningActions';
import { analyzeMisconceptionCandidateAction } from '@/app/actions/aiActions';
import { recordMisconceptionRecord } from '@/lib/services/learnerStateDbService';
import { logRouteEvent } from '@/lib/services/routeEventDbService';
import { computeRouteDiff } from '@/lib/engine/routeDiffEngine';
import WhyLearningThis from '@/components/learning/WhyLearningThis';
import RouteDiff from '@/components/learning/RouteDiff';
import { getCuratedResourcesForConcept } from '@/lib/learning/resourceCatalog';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ArrowRight,
  BookOpen,
  PlayCircle,
  ExternalLink,
  Code,
  Sparkles,
  Zap,
  Check,
  ChevronRight,
  Award,
} from 'lucide-react';

export default function ActivityRunnerPage({ params }: { params: Promise<{ activityId: string }> }) {
  const resolvedParams = use(params);
  const activityId = resolvedParams.activityId;
  const router = useRouter();
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [activity, setActivity] = useState<LearningActivity | null>(null);
  const [concept, setConcept] = useState<Concept | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'practice'>('learn');

  // Progressive Question Stepper state
  const [questions, setQuestions] = useState<LearningQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
    promotedToMastered: boolean;
  } | null>(null);

  // Dynamic route recalculation state
  const [routeDiff, setRouteDiff] = useState<RouteDiffType | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadActivity() {
      setIsLoading(true);
      try {
        // Single optimized relational read joining questions and parent concept
        const { data: act, error: actErr } = await supabase
          .from('learning_activities')
          .select('*, questions(*), concepts(*)')
          .eq('id', activityId)
          .single();

        if (actErr || !act) return;

        let conc = act.concepts;
        if (Array.isArray(conc)) {
          conc = conc[0];
        }

        if (!conc && act.concept_id) {
          const { data: fallbackConc } = await supabase
            .from('concepts')
            .select('*')
            .eq('id', act.concept_id)
            .single();
          conc = fallbackConc;
        }

        if (!isMounted) return;

        const loadedQuestions: LearningQuestion[] = (act.questions || [])
          .map((q: any) => ({
            id: q.id,
            activityId: q.activity_id,
            conceptId: q.concept_id,
            question: q.question,
            questionType: q.question_type,
            options: q.options || [],
            correctAnswer: q.correct_answer,
            explanation: q.explanation,
            orderIndex: q.order_index ?? 0,
          }))
          .sort((a: any, b: any) => a.orderIndex - b.orderIndex);

        // If activity has fewer than 3 questions (from older journeys), ensure 3 distinct progressive questions
        if (conc && loadedQuestions.length < 3) {
          const guide = getCuratedResourcesForConcept(conc.name, conc.domain);
          if (loadedQuestions.length === 0) {
            loadedQuestions.push({
              id: `${act.id}-q0`,
              activityId: act.id,
              conceptId: conc.id,
              question: `[Foundations] What is the primary conceptual invariant of ${conc.name}?`,
              questionType: 'mcq',
              difficulty: 'EASY',
              options: [
                'Maintaining verified preconditions and state invariants',
                'Arbitrary memory mutation without bounds checks',
                'Premature micro-optimization before correctness',
                'Skipping edge-case handling',
              ],
              correctAnswer: 'Maintaining verified preconditions and state invariants',
              explanation: 'Foundational mastery requires establishing core definitions and invariants.',
              orderIndex: 0,
            });
          }
          if (loadedQuestions.length === 1) {
            loadedQuestions.push({
              id: `${act.id}-q1`,
              activityId: act.id,
              conceptId: conc.id,
              question: `[Mechanics & Trace] When analyzing the algorithmic trade-offs of ${conc.name}, which aspect is paramount?`,
              questionType: 'mcq',
              difficulty: 'MEDIUM',
              options: [
                'Balancing time complexity with auxiliary space complexity',
                'Increasing code length arbitrarily without performance benefits',
                'Ignoring recursive stack depth limits',
                'Using global mutable variables across scopes',
              ],
              correctAnswer: 'Balancing time complexity with auxiliary space complexity',
              explanation: 'Intermediate competence requires evaluating runtime and memory trade-offs.',
              orderIndex: 1,
            });
          }
          if (loadedQuestions.length === 2) {
            loadedQuestions.push({
              id: `${act.id}-q2`,
              activityId: act.id,
              conceptId: conc.id,
              question: `[Edge Cases & Transfer] How does ${conc.name} behave under degenerate or boundary inputs?`,
              questionType: 'mcq',
              difficulty: 'HARD',
              options: [
                'It explicitly defends against pathological inputs and boundary conditions',
                'It silently overflows without signaling an error',
                'It assumes all inputs are strictly ordered',
                'It bypasses validation to save CPU cycles',
              ],
              correctAnswer: 'It explicitly defends against pathological inputs and boundary conditions',
              explanation: 'Advanced mastery proves resilience against boundary conditions and edge cases.',
              orderIndex: 2,
            });
          }
        }

        setQuestions(loadedQuestions);

        setActivity({
          id: act.id,
          journeyId: act.journey_id,
          conceptId: act.concept_id,
          type: act.type,
          title: act.title,
          description: act.description,
          instructions: act.instructions,
          thinkingPrompt: act.thinking_prompt,
          hints: act.hints || [],
          durationMinutes: act.duration_minutes,
          isRemediation: act.is_remediation,
          orderIndex: act.order_index,
          createdAt: act.created_at,
          questions: loadedQuestions,
        });

        if (conc) {
          setConcept({
            id: conc.id,
            journeyId: conc.journey_id,
            name: conc.name,
            slug: conc.slug,
            description: conc.description,
            domain: conc.domain,
            difficulty: conc.difficulty,
            masteryThreshold: conc.mastery_threshold,
            orderIndex: conc.order_index,
            createdAt: conc.created_at,
          });
        }
      } catch (err) {
        console.error('Failed to load activity:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadActivity();
    return () => {
      isMounted = false;
    };
  }, [activityId]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-semibold text-slate-500">Loading learning activity...</p>
      </div>
    );
  }

  if (!activity || !concept) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle size={36} className="mx-auto text-amber-500" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Activity Not Found</h2>
        <Link href="/app">
          <Button size="sm" variant="outline">
            Return to Navigation
          </Button>
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex] || null;
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;
  const studyGuide = getCuratedResourcesForConcept(concept.name, concept.domain);

  async function handleOptionSubmit() {
    if (!selectedOption || isSubmitting || submitted || !currentQuestion) return;

    setIsSubmitting(true);

    try {
      // 1. Authoritative server action execution (grades, records attempt, updates state)
      const res = await submitQuestionAttemptAction({
        activityId: activity!.id,
        questionId: currentQuestion.id.includes('-q') ? undefined : currentQuestion.id,
        conceptId: concept!.id,
        journeyId: activity!.journeyId,
        submittedAnswer: selectedOption,
        timeSpentSeconds: 30,
      });

      const isCorrect = res.isCorrect;
      setSubmitted(true);
      setFeedback({
        isCorrect,
        explanation: currentQuestion.explanation || '',
        promotedToMastered: res.promotedToMastered,
      });

      // 2. If incorrect, analyze candidate misconception
      if (!isCorrect) {
        try {
          const aiRes = await analyzeMisconceptionCandidateAction({
            conceptName: concept!.name,
            questionText: currentQuestion.question,
            correctAnswer: currentQuestion.correctAnswer,
            explanation: currentQuestion.explanation || '',
            submittedAnswer: selectedOption,
          });

          if (aiRes.success && aiRes.data.isMisconception && aiRes.data.confidence >= 0.70 && user) {
            const aiMisconception = aiRes.data;

            await recordMisconceptionRecord({
              userId: user.id,
              conceptId: concept!.id,
              activityId: activity!.id,
              attemptId: res.attemptId,
              misconceptionTitle: aiMisconception.misconceptionTitle,
              diagnosis: aiMisconception.diagnosis,
              confidence: aiMisconception.confidence,
            });

            await logRouteEvent({
              userId: user.id,
              journeyId: activity!.journeyId,
              triggerConceptId: concept!.id,
              eventType: 'MISCONCEPTION_REROUTE',
              reason: `Detected misconception: ${aiMisconception.misconceptionTitle}`,
              evidenceSummary: `Diagnosed: ${aiMisconception.diagnosis}`,
              previousAction: activity!.title,
              newAction: `Quick Review: ${aiMisconception.remediationTitle}`,
            });

            const diff = computeRouteDiff({
              triggerReason: `Detected misconception: ${aiMisconception.misconceptionTitle}`,
              triggerConceptName: concept!.name,
              concepts: [concept!],
              remediationTitle: aiMisconception.remediationTitle,
              remediationDurationMinutes: 6,
              nextActionTitle: `Quick Review: ${aiMisconception.remediationTitle}`,
            });

            setRouteDiff(diff);
          }
        } catch (aiErr) {
          console.warn('AI misconception analysis skipped:', aiErr);
        }
      }
    } catch (err) {
      console.error('Error submitting attempt:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setSubmitted(false);
      setFeedback(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back to Route Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Navigation Route</span>
        </Link>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('learn')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'learn'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen size={14} />
            <span>Study Guide & Videos</span>
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'practice'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap size={14} />
            <span>Practice Questions ({currentQuestionIndex + 1}/{questions.length})</span>
          </button>
        </div>
      </div>

      {/* Dynamic Route Diff Banner if Rerouted */}
      {routeDiff && (
        <RouteDiff
          diff={routeDiff}
          onDismiss={() => setRouteDiff(null)}
          onStartRemediation={() => router.push('/app')}
        />
      )}

      {/* Concept Header Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            Practice Lesson
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock size={13} />
            <span>~{activity.durationMinutes} minutes</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white font-heading">
            {activity.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Topic: <strong className="text-slate-800 dark:text-slate-200">{concept.name}</strong> • Subject: <span className="capitalize">{concept.domain}</span>
          </p>
        </div>

        {/* Why Are We Learning This? Signature Explanation */}
        <WhyLearningThis
          conceptName={concept.name}
          goalTitle="Your Learning Goal"
          requiredForNames={['Higher-order application']}
          demonstratedPrereqs={['Foundational topics']}
          synthesisNote="This concept provides key foundations for upcoming lessons in your goal."
        />
      </div>

      {/* TAB 1: STUDY GUIDE & CURATED LEARNING SOURCES */}
      {activeTab === 'learn' && (
        <div className="space-y-6">
          {/* Mental Model & Invariants */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Key Concept Explained
              </h3>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {studyGuide.mentalModel}
            </p>

            {/* Key Invariants */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Key Points to Remember
              </h4>
              <ul className="space-y-1.5">
                {studyGuide.keyInvariants.map((inv, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{inv}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Worked Code Example */}
            {studyGuide.workedExample && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-slate-400">
                  <Code size={13} />
                  <span>Worked Implementation Example</span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
                  <code>{studyGuide.workedExample}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Curated External Resources (YouTube, Docs, Blogs) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <BookOpen size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Curated Learning Sources
                </h3>
              </div>
              <span className="text-3xs text-slate-400">
                Verified External Materials
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {studyGuide.resources.map((res, i) => (
                <a
                  key={i}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-500 transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                        {res.platform}
                      </span>
                      {res.type === 'video' ? (
                        <PlayCircle size={16} className="text-red-500" />
                      ) : (
                        <ExternalLink size={14} className="text-slate-400 group-hover:text-indigo-500" />
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2">
                      {res.title}
                    </h4>
                    {res.description && (
                      <p className="text-2xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {res.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-3xs text-slate-400">
                    <span>{res.durationMinutes ? `~${res.durationMinutes}m read/watch` : 'Resource'}</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-0.5">
                      Open <ExternalLink size={10} />
                    </span>
                  </div>
                </a>
              ))}
            </div>

            {/* Jump to Practice Button */}
            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => setActiveTab('practice')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2"
              >
                <span>Ready to Practice → Start Drill</span>
                <Zap size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADAPTIVE PRACTICE DRILL (QUESTION STEPPER) */}
      {activeTab === 'practice' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5">
          {/* Question Stepper Header & Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-2xs">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-2xs font-mono text-slate-400">
                {currentQuestion?.difficulty || 'PRACTICE'} CHECKPOINT
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + (submitted && feedback?.isCorrect ? 1 : 0)) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {currentQuestion && (
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </h3>

              {/* MCQ Options */}
              <div className="space-y-2.5">
                {(currentQuestion.options || []).map((opt, i) => {
                  const isSelected = selectedOption === opt;
                  let optionStyle = 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60';

                  if (submitted) {
                    if (opt === currentQuestion.correctAnswer) {
                      optionStyle = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
                    } else if (isSelected && !feedback?.isCorrect) {
                      optionStyle = 'border-red-500 bg-red-50/70 dark:bg-red-950/40 text-red-900 dark:text-red-200';
                    }
                  } else if (isSelected) {
                    optionStyle = 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold';
                  }

                  return (
                    <button
                      key={i}
                      disabled={submitted || isSubmitting}
                      onClick={() => setSelectedOption(opt)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 enabled:cursor-pointer disabled:cursor-not-allowed ${optionStyle}`}
                    >
                      <span className="h-5 w-5 rounded-full border border-current flex items-center justify-center text-2xs font-bold shrink-0 mt-0.5">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action: Submit Answer */}
              {!submitted ? (
                <Button
                  onClick={handleOptionSubmit}
                  disabled={!selectedOption || isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl enabled:cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Checking your answer...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Answer</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </Button>
              ) : (
                /* Post-submission Result & Stepper Next Action */
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {feedback?.isCorrect ? (
                      <>
                        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-300">
                          Great job! That's correct!
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
                        <span className="text-amber-700 dark:text-amber-300">
                          Not quite right yet — let's review why:
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feedback?.explanation}
                  </p>

                  {/* Mastery Celebration Banner */}
                  {feedback?.promotedToMastered && (
                    <div className="p-3.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2.5">
                      <Award size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        🎉 Skill Mastered! You've proven your understanding and unlocked your next milestone!
                      </span>
                    </div>
                  )}

                  {/* Stepper Buttons: Next Question OR Return to Route */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {!isLastQuestion ? (
                      <Button
                        onClick={handleNextQuestion}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2 rounded-xl flex items-center gap-1.5"
                      >
                        <span>Next Question</span>
                        <ChevronRight size={14} />
                      </Button>
                    ) : (
                      <Link href="/app">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2 rounded-xl flex items-center gap-1.5">
                          <span>Finish & Return to Dashboard</span>
                          <ArrowRight size={14} />
                        </Button>
                      </Link>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('learn')}
                      className="text-xs"
                    >
                      Review Study Guide
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
