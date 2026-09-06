'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  Sparkles,
  BookOpen,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  HelpCircle,
  Loader2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createLearningJourneyAction } from '@/app/actions/learningActions';
import { createJourneyInDb } from '@/lib/services/journeyDbService';
import { LearningMode, ActivityStage, ActivityType } from '@/lib/types/learning';

const SUGGESTIONS = [
  'Indian Freedom Movement in Kolkata',
  'Mughal Architecture & Geometry in Delhi',
  'Mangrove Ecology in Sundarbans',
  'Photosynthesis & Tropical Flora',
  'Ancient Harappan Urban Planning',
];

export default function CreateJourneyPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthorized } = useAuthGuard({ requiredRole: 'teacher' });

  // Creation Mode: 'ai' or 'manual'
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');

  // Basic Details
  const [topicInput, setTopicInput] = useState('');
  const [subject, setSubject] = useState('History');
  const [gradeLevel, setGradeLevel] = useState('Class 8');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [language, setLanguage] = useState('English');
  const [deliveryMode, setDeliveryMode] = useState<LearningMode>('explore');
  const [durationDays, setDurationDays] = useState(1);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedJourney, setGeneratedJourney] = useState<any | null>(null);

  // Manual & Editable Data State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [objectives, setObjectives] = useState<Array<{ objective: string; blooms_level: string }>>([
    { objective: 'Understand foundational historical context.', blooms_level: 'understand' },
    { objective: 'Analyze on-site architectural and cultural evidence.', blooms_level: 'analyze' },
  ]);

  const [activities, setActivities] = useState<
    Array<{
      stage: ActivityStage;
      type: ActivityType;
      title: string;
      description: string;
      duration_minutes: number;
      instruction: string;
      thinking_prompt: string;
      place_name?: string;
      questions?: Array<{
        question: string;
        options: string[];
        correct_answer: string;
        explanation: string;
      }>;
    }>
  >([
    {
      stage: 'before',
      type: 'briefing',
      title: 'Preparation & Context Briefing',
      description: 'Orientation reading and conceptual background before field visit.',
      duration_minutes: 15,
      instruction: 'Read the summary and note key concepts.',
      thinking_prompt: 'What questions do you hope to answer at the location?',
    },
    {
      stage: 'during',
      type: 'observation',
      title: 'On-Site Observation Mission',
      description: 'Physical inspection and observational inquiry at the monument.',
      duration_minutes: 30,
      instruction: 'Identify 3 specific physical features.',
      thinking_prompt: 'How does what you see compare with textbook diagrams?',
      place_name: 'Main Landmark',
    },
    {
      stage: 'after',
      type: 'reflection',
      title: 'Synthesized Critical Reflection',
      description: 'Personal reflection evaluated by AI rubrics.',
      duration_minutes: 20,
      instruction: 'Submit your personal evaluation in 3-5 sentences.',
      thinking_prompt: 'What changed in your understanding after seeing the place in person?',
    },
  ]);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle AI Generation
  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) {
      setErrorMessage('Please enter a topic, location, or curriculum concept.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await createLearningJourneyAction({
        topicOrUrl: topicInput.trim(),
        subject,
        gradeLevel,
        difficulty,
        language,
        mode: deliveryMode,
        durationDays,
      });

      if (!res.success || !res.data) {
        setErrorMessage(res.error || 'Failed to generate journey. Please try again.');
        return;
      }

      const journey = res.data;
      setGeneratedJourney(journey);
      setTitle(journey.title);
      setDescription(journey.description);
      setCoverImage(journey.coverImage || '');

      if (journey.objectives && journey.objectives.length > 0) {
        setObjectives(
          journey.objectives.map((obj) => ({
            objective: obj.text,
            blooms_level: obj.bloomsLevel || 'understand',
          }))
        );
      }

      if (journey.activities && journey.activities.length > 0) {
        setActivities(
          journey.activities.map((act) => ({
            stage: act.stage,
            type: act.type,
            title: act.title,
            description: act.description,
            duration_minutes: act.durationMinutes,
            instruction: act.instruction || '',
            thinking_prompt: act.thinkingPrompt || '',
            place_name: act.placeName || '',
            questions: act.quizQuestions?.map((q) => ({
              question: q.question,
              options: q.options || [],
              correct_answer: String(q.correctAnswer || ''),
              explanation: q.explanation || '',
            })),
          }))
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating journey with AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Database Save
  const handleSaveToDatabase = async () => {
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Please provide a title and description for the journey.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await createJourneyInDb(user.id, {
        title: title.trim(),
        description: description.trim(),
        subject,
        grade_level: gradeLevel,
        difficulty,
        language,
        mode: deliveryMode,
        duration_days: durationDays,
        cover_image: coverImage || undefined,
        objectives: objectives.map((o, idx) => ({
          objective: o.objective,
          blooms_level: o.blooms_level,
          order_index: idx,
        })),
        activities: activities.map((a, idx) => ({
          stage: a.stage,
          type: a.type,
          title: a.title,
          description: a.description,
          duration_minutes: a.duration_minutes,
          instruction: a.instruction,
          thinking_prompt: a.thinking_prompt,
          place_name: a.place_name,
          order_index: idx,
          questions: a.questions?.map((q) => ({
            question: q.question,
            question_type: 'mcq',
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
          })),
        })),
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to save journey to database.');
        return;
      }

      router.push('/teacher/journeys');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save journey.');
    } finally {
      setIsSaving(false);
    }
  };

  // Objective Helpers
  const addObjective = () => {
    setObjectives([...objectives, { objective: '', blooms_level: 'understand' }]);
  };
  const removeObjective = (idx: number) => {
    setObjectives(objectives.filter((_, i) => i !== idx));
  };

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-semibold text-slate-500">Verifying teacher permissions...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/teacher/journeys"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to My Journeys</span>
        </Link>

        {/* Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCreationMode('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              creationMode === 'ai'
                ? 'bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sparkles size={13} className="text-indigo-600" />
            <span>AI Curriculum Synthesis</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCreationMode('manual');
              if (!title) setTitle('New Experiential Learning Journey');
              if (!description) setDescription('Curriculum-aligned exploration connecting textbook principles to real-world context.');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              creationMode === 'manual'
                ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <BookOpen size={13} />
            <span>Manual Builder</span>
          </button>
        </div>
      </div>

      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
          {creationMode === 'ai' ? 'Generate Journey with AI' : 'Create Learning Journey'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Design structured learning experiences across Before, During, and After stages.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Mode 1: AI Prompt Section */}
      {creationMode === 'ai' && (
        <div className="p-6 rounded-2xl border border-indigo-200/80 bg-white/95 dark:border-indigo-950/80 dark:bg-slate-900/90 shadow-lg shadow-indigo-950/5 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              AI Prompt & Curriculum Parameters
            </span>
          </div>

          <form onSubmit={handleGenerateAI} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Learning Topic, Location, or Concept
              </label>
              <input
                type="text"
                required
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g. Indian Freedom Movement in Kolkata or Photosynthesis in Botanical Gardens"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400">Quick suggestions:</span>
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setTopicInput(sug)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white"
                >
                  <option value="History">History</option>
                  <option value="Science">Science / Biology</option>
                  <option value="Geography">Geography</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Civics">Civics / Polity</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Grade Level
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white"
                >
                  <option value="Class 6">Class 6</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 12">Class 12</option>
                  <option value="Undergraduate">College / UG</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Duration
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white"
                >
                  <option value={1}>1 Day</option>
                  <option value={2}>2 Days</option>
                  <option value={3}>3 Days</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Synthesizing Curriculum with Gemini 2.5 Flash...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Full Journey Structure</span>
                </>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Review / Manual Builder Form */}
      {(generatedJourney || creationMode === 'manual') && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Journey Overview
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full">
                Ready to Review & Save
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Journey Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kolkata Heritage: Freedom Movement"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Description & Curriculum Alignment
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                  Learning Objectives ({objectives.length})
                </span>
                <span className="text-[11px] text-slate-400">Mapped to Bloom&apos;s Taxonomy levels</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addObjective}
                className="text-xs font-semibold rounded-xl"
              >
                <Plus size={13} className="mr-1" />
                <span>Add Objective</span>
              </Button>
            </div>

            <div className="space-y-3">
              {objectives.map((obj, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <span className="h-6 w-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={obj.objective}
                    onChange={(e) => {
                      const updated = [...objectives];
                      updated[idx].objective = e.target.value;
                      setObjectives(updated);
                    }}
                    placeholder="Enter learning objective..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white"
                  />
                  <select
                    value={obj.blooms_level}
                    onChange={(e) => {
                      const updated = [...objectives];
                      updated[idx].blooms_level = e.target.value;
                      setObjectives(updated);
                    }}
                    className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-700 dark:text-slate-300 capitalize"
                  >
                    <option value="remember">Remember</option>
                    <option value="understand">Understand</option>
                    <option value="apply">Apply</option>
                    <option value="analyze">Analyze</option>
                    <option value="evaluate">Evaluate</option>
                    <option value="create">Create</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeObjective(idx)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Activities Preview (Before -> During -> After) */}
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                  3-Stage Learning Pipeline ({activities.length} Activities)
                </span>
                <span className="text-[11px] text-slate-400">Before (Prepare), During (Explore & Practice), After (Assess & Reflect)</span>
              </div>
            </div>

            <div className="space-y-3">
              {activities.map((act, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        Stage: {act.stage}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                        Type: {act.type}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{act.duration_minutes} mins</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {idx + 1}. {act.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {act.description}
                    </p>
                  </div>

                  {act.thinking_prompt && (
                    <div className="p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100/60 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300">
                      <span className="font-semibold">Inquiry Prompt:</span> {act.thinking_prompt}
                    </div>
                  )}

                  {act.questions && act.questions.length > 0 && (
                    <div className="pt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Includes {act.questions.length} formative quiz question{act.questions.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Final Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link href="/teacher/journeys">
              <Button variant="outline" className="text-xs font-semibold py-2.5 px-4 rounded-xl">
                Cancel
              </Button>
            </Link>

            <Button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-6 rounded-xl shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Learning Journey to Database</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
