'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  HelpCircle,
  Brain,
  Send,
  Loader2,
  ChevronRight,
  Award,
  AlertCircle,
  MessageSquare,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getJourneyWithDetails,
  getStudentJourneyProgress,
  submitActivityCompletion,
  saveStudentReflection,
  DbLearningJourney,
  DbLearningActivity,
  DbReflection,
} from '@/lib/services/journeyDbService';
import {
  evaluateReflectionAction,
  askLearningCopilotAction,
} from '@/app/actions/learningActions';

export default function StudentJourneyWorkspacePage() {
  const params = useParams();
  const journeyId = params.id as string;

  const { user, isLoading: authLoading, isAuthorized } = useAuthGuard({ requiredRole: 'student' });

  // Core Data State
  const [journey, setJourney] = useState<DbLearningJourney | null>(null);
  const [completedActivityIds, setCompletedActivityIds] = useState<string[]>([]);
  const [activityScores, setActivityScores] = useState<Record<string, number>>({});
  const [reflections, setReflections] = useState<Record<string, DbReflection>>({});
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Active Stage Tab: 'before' | 'during' | 'after'
  const [activeStage, setActiveStage] = useState<'before' | 'during' | 'after'>('before');

  // Quiz State per activity: activityId -> { selectedOptions: { qIdx: option }, isSubmitted: boolean, score: number }
  const [quizAnswers, setQuizAnswers] = useState<Record<string, Record<number, string>>>({});
  const [quizSubmitting, setQuizSubmitting] = useState<string | null>(null);

  // Reflection State per activity: activityId -> responseText
  const [reflectionInput, setReflectionInput] = useState<Record<string, string>>({});
  const [reflectionEvaluating, setReflectionEvaluating] = useState<string | null>(null);

  // Learning Copilot State
  const [copilotQuestion, setCopilotQuestion] = useState('');
  const [copilotAnswer, setCopilotAnswer] = useState<string | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // General Action State
  const [completingActivityId, setCompletingActivityId] = useState<string | null>(null);

  useEffect(() => {
    if (!journeyId || !user) return;
    let isMounted = true;

    async function load() {
      setIsDataLoading(true);
      try {
        const [journeyDetails, progress] = await Promise.all([
          getJourneyWithDetails(journeyId),
          getStudentJourneyProgress(user!.id, journeyId),
        ]);

        if (isMounted) {
          setJourney(journeyDetails);
          setCompletedActivityIds(progress.completedActivityIds);
          setActivityScores(progress.activityScores);
          setReflections(progress.reflections);

          // Prepopulate reflection inputs if already submitted
          const initialReflections: Record<string, string> = {};
          Object.entries(progress.reflections).forEach(([actId, ref]) => {
            initialReflections[actId] = ref.response;
          });
          setReflectionInput(initialReflections);
        }
      } catch (err) {
        console.error('Error loading journey workspace:', err);
      } finally {
        if (isMounted) setIsDataLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [journeyId, user]);

  // Mark an activity as completed
  const handleCompleteActivity = async (activityId: string, score: number = 100) => {
    if (!user || !journey) return;
    setCompletingActivityId(activityId);

    const ok = await submitActivityCompletion(user.id, journey.id, activityId, { score });
    if (ok) {
      setCompletedActivityIds((prev) => Array.from(new Set([...prev, activityId])));
      setActivityScores((prev) => ({ ...prev, [activityId]: score }));
    }
    setCompletingActivityId(null);
  };

  // Submit Quiz for an activity
  const handleQuizSubmit = async (activity: DbLearningActivity) => {
    if (!user || !journey || !activity.questions) return;
    const answers = quizAnswers[activity.id] || {};

    let correctCount = 0;
    activity.questions.forEach((q, idx) => {
      if (answers[idx] === q.correct_answer) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / activity.questions.length) * 100);

    setQuizSubmitting(activity.id);
    const ok = await submitActivityCompletion(user.id, journey.id, activity.id, {
      score: calculatedScore,
    });

    if (ok) {
      setCompletedActivityIds((prev) => Array.from(new Set([...prev, activity.id])));
      setActivityScores((prev) => ({ ...prev, [activity.id]: calculatedScore }));
    }
    setQuizSubmitting(null);
  };

  // Submit Reflection for live Gemini AI evaluation
  const handleReflectionSubmit = async (activity: DbLearningActivity) => {
    if (!user || !journey) return;
    const text = (reflectionInput[activity.id] || '').trim();
    if (text.length < 15) {
      alert('Please write at least a couple of sentences to share your observations.');
      return;
    }

    setReflectionEvaluating(activity.id);
    try {
      const prompt = activity.thinking_prompt || activity.instruction || 'Reflect on your observations.';
      const res = await evaluateReflectionAction(prompt, text, journey.grade_level, journey.subject);

      const aiFeedback = res.feedback || 'Good critical observation.';
      const rubrics = {
        depth: res.rubric_depth || 4,
        accuracy: res.rubric_accuracy || 4,
        synthesis: res.rubric_synthesis || 4,
      };

      const ok = await saveStudentReflection(
        user.id,
        journey.id,
        activity.id,
        prompt,
        text,
        aiFeedback,
        rubrics
      );

      if (ok) {
        setCompletedActivityIds((prev) => Array.from(new Set([...prev, activity.id])));
        setReflections((prev) => ({
          ...prev,
          [activity.id]: {
            id: 'temp-id',
            journey_id: journey.id,
            user_id: user.id,
            activity_id: activity.id,
            prompt,
            response: text,
            ai_feedback: aiFeedback,
            rubric_depth: rubrics.depth,
            rubric_accuracy: rubrics.accuracy,
            rubric_synthesis: rubrics.synthesis,
            created_at: new Date().toISOString(),
          },
        }));
      }
    } catch (err) {
      console.error('Reflection submission error:', err);
      alert('Error submitting reflection.');
    } finally {
      setReflectionEvaluating(null);
    }
  };

  // Learning Copilot Q&A
  const handleAskCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuestion.trim() || !journey) return;

    setCopilotLoading(true);
    setCopilotAnswer(null);

    try {
      const res = await askLearningCopilotAction({
        journeyTitle: journey.title,
        subject: journey.subject,
        gradeLevel: journey.grade_level,
        currentStopName: journey.activities?.[0]?.place_name,
        currentActivityTitle: journey.activities?.[0]?.title,
        userMessage: copilotQuestion.trim(),
      });

      if (res.success && res.answer) {
        setCopilotAnswer(res.answer);
      } else {
        setCopilotAnswer('I am here to guide your observations! What specific detail are you examining?');
      }
    } catch (err) {
      setCopilotAnswer('Could not reach Copilot at this moment. Please try again.');
    } finally {
      setCopilotLoading(false);
    }
  };

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-semibold text-slate-500">Checking enrollment...</p>
      </div>
    );
  }

  if (isDataLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16 text-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
        <p className="text-xs text-slate-500">Loading learning journey workspace...</p>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Journey Not Found</h2>
        <Link href="/student/dashboard">
          <Button size="sm" variant="outline" className="text-xs rounded-xl">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const allActivities = journey.activities || [];
  const totalActivities = allActivities.length;
  const completedCount = allActivities.filter((a) => completedActivityIds.includes(a.id)).length;
  const progressPercent = totalActivities > 0 ? Math.round((completedCount / totalActivities) * 100) : 0;

  const currentStageActivities = allActivities.filter((a) => a.stage === activeStage);

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/student/dashboard"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>

        {/* Progress Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Progress:</span>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {completedCount}/{totalActivities} ({progressPercent}%)
          </span>
          <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
            {journey.subject}
          </span>
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {journey.grade_level}
          </span>
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">
            {journey.difficulty}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
          {journey.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          {journey.description}
        </p>
      </div>

      {/* 3-Stage Segmented Tabs (Before -> During -> After) */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveStage('before')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeStage === 'before'
              ? 'bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span>1. BEFORE (Prepare)</span>
          {allActivities.filter((a) => a.stage === 'before').every((a) => completedActivityIds.includes(a.id)) && (
            <CheckCircle2 size={14} className="text-emerald-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveStage('during')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeStage === 'during'
              ? 'bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span>2. DURING (Explore & Practice)</span>
          {allActivities.filter((a) => a.stage === 'during').every((a) => completedActivityIds.includes(a.id)) && (
            <CheckCircle2 size={14} className="text-emerald-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveStage('after')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeStage === 'after'
              ? 'bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span>3. AFTER (Reflect & Assess)</span>
          {allActivities.filter((a) => a.stage === 'after').every((a) => completedActivityIds.includes(a.id)) && (
            <CheckCircle2 size={14} className="text-emerald-500" />
          )}
        </button>
      </div>

      {/* Content Layout: Left Stage Activities, Right AI Copilot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Stage Activities */}
        <div className="lg:col-span-2 space-y-6">
          {currentStageActivities.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No specific activities recorded in this stage.
            </div>
          ) : (
            currentStageActivities.map((act, idx) => {
              const isCompleted = completedActivityIds.includes(act.id);
              const score = activityScores[act.id];
              const reflectionRecord = reflections[act.id];

              return (
                <div
                  key={act.id}
                  className={`p-6 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'border-emerald-200/80 bg-white/95 dark:border-emerald-950/60 dark:bg-slate-900/90 shadow-xs'
                      : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm'
                  } space-y-4`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                        {act.type}
                      </span>
                      {act.place_name && (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                          <MapPin size={10} />
                          <span>{act.place_name}</span>
                        </span>
                      )}
                    </div>

                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70">
                        <CheckCircle2 size={12} />
                        <span>Completed {score !== undefined ? `(${score}%)` : ''}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {idx + 1}. {act.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      {act.description}
                    </p>
                  </div>

                  {act.instruction && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-semibold text-slate-900 dark:text-white">Instruction:</span> {act.instruction}
                    </div>
                  )}

                  {act.thinking_prompt && (
                    <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
                      <span className="font-semibold">Inquiry Prompt:</span> {act.thinking_prompt}
                    </div>
                  )}

                  {/* Formative Quiz Checkpoint */}
                  {act.type === 'quiz' && act.questions && act.questions.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                        Formative Knowledge Check ({act.questions.length} Questions)
                      </span>

                      {act.questions.map((q, qIdx) => {
                        const currentAnswer = quizAnswers[act.id]?.[qIdx];
                        const isCorrect = isCompleted && currentAnswer === q.correct_answer;

                        return (
                          <div
                            key={q.id || qIdx}
                            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-2.5 text-xs"
                          >
                            <p className="font-bold text-slate-900 dark:text-white">
                              {qIdx + 1}. {q.question}
                            </p>

                            <div className="space-y-1.5">
                              {q.options.map((opt) => (
                                <label
                                  key={opt}
                                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                                    currentAnswer === opt
                                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                                      : 'border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`quiz-${act.id}-${qIdx}`}
                                    checked={currentAnswer === opt}
                                    disabled={isCompleted}
                                    onChange={() => {
                                      setQuizAnswers((prev) => ({
                                        ...prev,
                                        [act.id]: {
                                          ...(prev[act.id] || {}),
                                          [qIdx]: opt,
                                        },
                                      }));
                                    }}
                                    className="text-indigo-600"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>

                            {isCompleted && (
                              <div className="pt-1.5 text-[11px] text-slate-500">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  Correct Answer: {q.correct_answer}
                                </span>
                                {q.explanation && <span> — {q.explanation}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {!isCompleted && (
                        <Button
                          onClick={() => handleQuizSubmit(act)}
                          disabled={quizSubmitting === act.id}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl cursor-pointer"
                        >
                          {quizSubmitting === act.id ? (
                            <>
                              <Loader2 size={14} className="animate-spin mr-1.5" />
                              <span>Evaluating Quiz...</span>
                            </>
                          ) : (
                            <span>Submit Quiz Answers</span>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Reflection Submission with Live Gemini Evaluation */}
                  {act.type === 'reflection' && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                        Your Personal Synthesis & Reflection
                      </span>

                      <textarea
                        rows={4}
                        disabled={isCompleted}
                        value={reflectionInput[act.id] || ''}
                        onChange={(e) =>
                          setReflectionInput({ ...reflectionInput, [act.id]: e.target.value })
                        }
                        placeholder="Write your reflection here. What surprised you? How does this place connect to your curriculum?"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      {!isCompleted ? (
                        <Button
                          onClick={() => handleReflectionSubmit(act)}
                          disabled={reflectionEvaluating === act.id}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          {reflectionEvaluating === act.id ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Gemini 2.5 Flash Evaluating Reflection...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} />
                              <span>Submit for AI Rubric Evaluation</span>
                            </>
                          )}
                        </Button>
                      ) : (
                        reflectionRecord && (
                          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                <Sparkles size={14} />
                                <span>Gemini AI Evaluation</span>
                              </span>
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                Depth: {reflectionRecord.rubric_depth}/5 • Accuracy: {reflectionRecord.rubric_accuracy}/5 • Synthesis: {reflectionRecord.rubric_synthesis}/5
                              </span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                              &ldquo;{reflectionRecord.ai_feedback}&rdquo;
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Standard Briefing or Mission Completion Button */}
                  {act.type !== 'quiz' && act.type !== 'reflection' && !isCompleted && (
                    <Button
                      onClick={() => handleCompleteActivity(act.id)}
                      disabled={completingActivityId === act.id}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer"
                    >
                      {completingActivityId === act.id ? (
                        <>
                          <Loader2 size={14} className="animate-spin mr-1.5" />
                          <span>Saving Progress...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} className="mr-1.5" />
                          <span>Mark Activity Complete</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: AI Learning Copilot */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-indigo-200/80 bg-white dark:border-indigo-950/80 dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Brain size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                AI Learning Copilot ({journey.grade_level})
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Have a question about what you are seeing? Ask your copilot for an age-appropriate explanation.
            </p>

            {copilotAnswer && (
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Copilot Response
                </span>
                <p>{copilotAnswer}</p>
              </div>
            )}

            <form onSubmit={handleAskCopilot} className="space-y-2">
              <input
                type="text"
                value={copilotQuestion}
                onChange={(e) => setCopilotQuestion(e.target.value)}
                placeholder="e.g. Explain why this dome was built this way..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button
                type="submit"
                disabled={copilotLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copilotLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Ask Question</span>
                  </>
                )}
              </Button>
            </form>

            <div className="pt-2 text-[11px] text-slate-400 space-y-1 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold block">Try asking:</span>
              <button
                type="button"
                onClick={() => setCopilotQuestion('Explain this like I am in Class 6.')}
                className="text-left text-indigo-600 dark:text-indigo-400 hover:underline block"
              >
                &bull; &ldquo;Explain this like I am in Class 6.&rdquo;
              </button>
              <button
                type="button"
                onClick={() => setCopilotQuestion('What should I observe at this place?')}
                className="text-left text-indigo-600 dark:text-indigo-400 hover:underline block"
              >
                &bull; &ldquo;What should I observe at this place?&rdquo;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
