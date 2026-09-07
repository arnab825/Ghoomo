'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import {
  LearningActivity,
  Concept,
  LearningQuestion,
  RouteDiff as RouteDiffType,
} from '@/lib/types/engine';
import { submitQuestionAttemptAction } from '@/app/actions/learningActions';
import { analyzeMisconceptionCandidateAction } from '@/app/actions/aiActions';
import { recordMisconceptionRecord } from '@/lib/services/learnerStateDbService';
import { logRouteEvent } from '@/lib/services/routeEventDbService';
import { computeRouteDiff } from '@/lib/engine/routeDiffEngine';
import RouteDiff from '@/components/learning/RouteDiff';
import { getCuratedResourcesForConcept } from '@/lib/learning/resourceCatalog';
import { Button } from '@/components/ui/button';
import ContextPanel from '@/components/shared/ContextPanel';
import DifficultyLadder from '@/components/learning/DifficultyLadder';
import RichContentRenderer from '@/components/learning/RichContentRenderer';
import EvidenceSubmission from '@/components/learning/EvidenceSubmission';
import ProgressIndicator from '@/components/shared/ProgressIndicator';
import { formatResourceType } from '@/lib/utils/terminology';
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
  Sparkles,
  Check,
  Award,
  Lightbulb,
  FileCode,
  Compass,
} from 'lucide-react';

export default function ActivityRunnerPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const resolvedParams = use(params);
  const activityId = resolvedParams.activityId;
  const router = useRouter();
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [activity, setActivity] = useState<LearningActivity | null>(null);
  const [concept, setConcept] = useState<Concept | null>(null);
  const [activeTab, setActiveTab] = useState<'study' | 'practice' | 'show_work'>('study');

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

        // Ensure 3 progressive questions for ladder progression
        if (conc && loadedQuestions.length < 3) {
          if (loadedQuestions.length === 0) {
            loadedQuestions.push({
              id: `${act.id}-q0`,
              activityId: act.id,
              conceptId: conc.id,
              question: `[Level 1: Understand] What is the primary conceptual principle of ${conc.name}?`,
              questionType: 'mcq',
              difficulty: 'EASY',
              options: [
                'Maintaining verified preconditions and state invariants',
                'Arbitrary memory mutation without bounds checks',
                'Premature micro-optimization before correctness',
                'Skipping edge-case handling',
              ],
              correctAnswer: 'Maintaining verified preconditions and state invariants',
              explanation: 'Foundational understanding requires establishing core definitions and invariants.',
              orderIndex: 0,
            });
          }
          if (loadedQuestions.length === 1) {
            loadedQuestions.push({
              id: `${act.id}-q1`,
              activityId: act.id,
              conceptId: conc.id,
              question: `[Level 2: Apply] In a real-world scenario using ${conc.name}, how is correctness verified?`,
              questionType: 'mcq',
              difficulty: 'MEDIUM',
              options: [
                'By balancing time complexity with auxiliary space constraints',
                'By ignoring runtime exceptions',
                'By assuming all data is already sorted without validation',
                'By bypassing tests to deploy faster',
              ],
              correctAnswer: 'By balancing time complexity with auxiliary space constraints',
              explanation: 'Application competence requires evaluating runtime, memory, and bounds.',
              orderIndex: 1,
            });
          }
          if (loadedQuestions.length === 2) {
            loadedQuestions.push({
              id: `${act.id}-q2`,
              activityId: act.id,
              conceptId: conc.id,
              question: `[Level 3: Reason] How does ${conc.name} behave when given boundary or pathological inputs?`,
              questionType: 'mcq',
              difficulty: 'HARD',
              options: [
                'It explicitly defends against degenerate edge cases and invalid states',
                'It silently overflows without signaling an error',
                'It assumes memory is infinite',
                'It yields non-deterministic results',
              ],
              correctAnswer: 'It explicitly defends against degenerate edge cases and invalid states',
              explanation: 'Advanced reasoning requires evaluating stability and trade-offs under edge cases.',
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
      <div className="min-h-[55vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-saffron-500" />
        <p className="text-xs font-semibold text-slate-500">Preparing your study workspace...</p>
      </div>
    );
  }

  if (!activity || !concept) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle size={36} className="mx-auto text-amber-500" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
          Lesson Not Found
        </h2>
        <p className="text-xs text-slate-500">
          This learning activity may have been updated or moved.
        </p>
        <Link href="/app/journeys">
          <Button size="sm" variant="outline" className="rounded-xl">
            Return to Learning Map
          </Button>
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex] || null;
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;
  const studyGuide = getCuratedResourcesForConcept(concept.name, concept.domain);
  const currentLevelNumber = Math.min(5, Math.max(1, currentQuestionIndex + 1));

  async function handleOptionSubmit() {
    if (!selectedOption || isSubmitting || submitted || !currentQuestion) return;

    setIsSubmitting(true);

    try {
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

      // Misconception detection on incorrect answer
      if (!isCorrect) {
        try {
          const aiRes = await analyzeMisconceptionCandidateAction({
            conceptName: concept!.name,
            questionText: currentQuestion.question,
            correctAnswer: currentQuestion.correctAnswer,
            explanation: currentQuestion.explanation || '',
            submittedAnswer: selectedOption,
          });

          if (aiRes.success && aiRes.data.isMisconception && aiRes.data.confidence >= 0.7 && user) {
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
              reason: `Cleared up idea: ${aiMisconception.misconceptionTitle}`,
              evidenceSummary: `Diagnosed: ${aiMisconception.diagnosis}`,
              previousAction: activity!.title,
              newAction: `Review: ${aiMisconception.remediationTitle}`,
            });

            const diff = computeRouteDiff({
              triggerReason: "Let's clear up this foundational idea before moving forward.",
              triggerConceptName: concept!.name,
              concepts: [concept!],
              remediationTitle: aiMisconception.remediationTitle,
              remediationDurationMinutes: 3,
              nextActionTitle: `Review: ${aiMisconception.remediationTitle}`,
            });
            setRouteDiff(diff);
          }
        } catch (aiErr) {
          console.error('Misconception analysis error:', aiErr);
        }
      }
    } catch (err) {
      console.error('Submit question error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNextQuestion() {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setSubmitted(false);
      setFeedback(null);
    } else {
      router.push(`/app/journeys/${activity!.journeyId}`);
    }
  }

  // Define tabs for ContextPanel
  const contextPanelTabs = [
    {
      id: 'resources',
      label: 'Resources',
      icon: <BookOpen size={15} className="text-indigo-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-2xs uppercase font-bold text-slate-400">
            Recommended Study Materials
          </div>
          {studyGuide ? (
            <div className="space-y-3">
              <a
                href={studyGuide.primaryDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-saffron-500 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                  <span>{studyGuide.primaryDoc.title}</span>
                  <ExternalLink size={13} className="text-slate-400" />
                </div>
                <div className="text-3xs text-slate-500 mt-1">
                  {formatResourceType('docs')} • {studyGuide.primaryDoc.platform}
                </div>
              </a>

              <a
                href={studyGuide.videoTutorial.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-saffron-500 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                  <span>{studyGuide.videoTutorial.title}</span>
                  <ExternalLink size={13} className="text-slate-400" />
                </div>
                <div className="text-3xs text-slate-500 mt-1">
                  {formatResourceType('video')} • {studyGuide.videoTutorial.platform}
                </div>
              </a>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Resources available in topic details.</p>
          )}
        </div>
      ),
    },
    {
      id: 'hints',
      label: 'Hints',
      icon: <Lightbulb size={15} className="text-amber-500" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <div className="text-2xs uppercase font-bold text-slate-400">Thinking Prompts</div>
          {activity.thinkingPrompt ? (
            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
              {activity.thinkingPrompt}
            </div>
          ) : (
            <p>Focus on maintaining correctness before optimizing for performance.</p>
          )}

          {activity.hints && activity.hints.length > 0 && (
            <div className="space-y-2 mt-3">
              <div className="text-2xs uppercase font-bold text-slate-400">Step Hints</div>
              {activity.hints.map((hint, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                >
                  <span className="font-semibold text-saffron-500 mr-1.5">Hint {idx + 1}:</span>
                  {hint}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    ...(routeDiff
      ? [
          {
            id: 'path_update',
            label: 'Path Update',
            icon: <Sparkles size={15} className="text-saffron-500" />,
            badge: '!',
            content: (
              <div className="space-y-3">
                <div className="text-2xs uppercase font-bold text-saffron-600 dark:text-saffron-400">
                  Adaptive Path Adjustment
                </div>
                <RouteDiff diff={routeDiff} />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top Workspace Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/app/journeys/${activity.journeyId}`}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Return to Learning Map"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="text-3xs uppercase tracking-wider font-bold text-slate-400">
              {concept.domain || 'Learning Journey'}
            </div>
            <h1 className="text-sm sm:text-base font-bold font-heading text-slate-900 dark:text-white line-clamp-1">
              {concept.name}
            </h1>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('study')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'study'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lesson Study
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'practice'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Practice & Checks
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('show_work')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'show_work'
                ? 'bg-white dark:bg-slate-900 text-saffron-600 dark:text-saffron-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={13} className="text-saffron-500" />
            <span>Show Your Work</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area + Context Panel */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto">
          {/* Difficulty Ladder Header */}
          <DifficultyLadder currentLevel={currentLevelNumber} />

          {/* Active Tab View */}
          {activeTab === 'study' ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              <RichContentRenderer
                topicName={concept.name}
                description={concept.description}
              />
              <div className="flex items-center justify-end pt-4">
                <Button
                  onClick={() => setActiveTab('practice')}
                  className="bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-xl flex items-center gap-2"
                >
                  <span>Begin Practice & Challenges</span>
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          ) : activeTab === 'show_work' ? (
            <div className="animate-in fade-in duration-200">
              <EvidenceSubmission
                journeyId={activity.journeyId}
                conceptId={concept.id}
                activityId={activity.id}
                conceptName={concept.name}
                onSuccess={() => {
                  // Optional callback
                }}
              />
            </div>
          ) : (
            /* Practice & Progressive Questions */
            <div className="space-y-6 animate-in fade-in duration-200">
              {currentQuestion ? (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
                  {/* Stepper Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <ProgressIndicator
                      value={((currentQuestionIndex + 1) / questions.length) * 100}
                      size="sm"
                      className="w-28"
                    />
                  </div>

                  {/* Question Prompt */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {currentQuestion.question}
                    </h3>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {(currentQuestion.options || []).map((opt, idx) => {
                      const isSelected = selectedOption === opt;
                      const isCorrect = submitted && opt === currentQuestion.correctAnswer;
                      const isWrong = submitted && isSelected && !isCorrect;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={submitted || isSubmitting}
                          onClick={() => setSelectedOption(opt)}
                          className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 ${
                            isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-100'
                              : isWrong
                              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-900 dark:text-rose-100'
                              : isSelected
                              ? 'bg-saffron-500/10 border-saffron-500 text-saffron-900 dark:text-saffron-100 ring-1 ring-saffron-500'
                              : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <span>{opt}</span>
                          {isCorrect ? (
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                          ) : isWrong ? (
                            <AlertCircle size={18} className="text-rose-500 shrink-0" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Banner */}
                  {submitted && feedback && (
                    <div
                      className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                        feedback.isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      <div className="font-bold mb-1 flex items-center gap-1.5">
                        {feedback.isCorrect ? (
                          <>
                            <CheckCircle2 size={16} />
                            <span>Correct! Excellent Reasoning.</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={16} />
                            <span>Let&apos;s Review This Concept.</span>
                          </>
                        )}
                      </div>
                      <p>{feedback.explanation}</p>
                    </div>
                  )}

                  {/* Question Bottom Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('show_work')}
                      className="text-xs text-saffron-600 dark:text-saffron-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Sparkles size={13} />
                      <span>Prefer to write code or show your work?</span>
                    </button>

                    {!submitted ? (
                      <Button
                        onClick={handleOptionSubmit}
                        disabled={!selectedOption || isSubmitting}
                        className="bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-xl px-5"
                      >
                        {isSubmitting ? 'Checking...' : 'Check Answer'}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNextQuestion}
                        className="bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-xl flex items-center gap-2 px-5"
                      >
                        <span>{isLastQuestion ? 'Complete Topic' : 'Next Challenge'}</span>
                        <ArrowRight size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </main>

        {/* Side Panel: Contextual Companion */}
        <ContextPanel
          title="Study Companion"
          tabs={contextPanelTabs}
          defaultTabId="resources"
          className="shrink-0"
        />
      </div>
    </div>
  );
}
