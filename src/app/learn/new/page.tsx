"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  MapPin,
  Compass,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Layers,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Check,
  Globe,
  Brain,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateJourneyMutation } from "@/hooks/useLearningQueries";
import { LearningMode } from "@/lib/types/learning";
import { useToast } from "@/components/shared/ToastContext";

const GENERATION_STEPS = [
  "Analyzing educational source & pedagogical concepts...",
  "Synthesizing curriculum standards for your grade level...",
  "Mapping real-world locations & observation missions...",
  "Generating formative checks & active inquiry questions...",
  "Formulating reflection prompts & final learning rubric...",
];

export default function CreateLearningJourneyWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createJourneyMutation = useCreateJourneyMutation();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [topicOrUrl, setTopicOrUrl] = useState<string>("");
  const [subject, setSubject] = useState<string>("History");
  const [gradeLevel, setGradeLevel] = useState<string>("Class 8");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [language, setLanguage] = useState<string>("English");
  const [durationDays, setDurationDays] = useState<number>(2);
  const [learningStyle, setLearningStyle] = useState<"visual" | "activity_based" | "reading" | "multimodal">("activity_based");
  const [mode, setMode] = useState<LearningMode>("explore");

  // Editable Objectives
  const [objectives, setObjectives] = useState<string[]>([
    "Understand how key historical and social factors shaped this topic.",
    "Examine real-world evidence and physical artifacts.",
    "Evaluate multiple perspectives and contrast textbook accounts with primary sources.",
  ]);
  const [newObjectiveText, setNewObjectiveText] = useState<string>("");

  // Progress Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStageIndex, setGenerationStageIndex] = useState<number>(0);

  // Populate from query params if available
  useEffect(() => {
    const qTopic = searchParams.get("topic");
    const qGrade = searchParams.get("grade");
    const qSubject = searchParams.get("subject");

    if (qTopic) setTopicOrUrl(qTopic);
    if (qGrade) setGradeLevel(qGrade);
    if (qSubject) setSubject(qSubject);
  }, [searchParams]);

  const handleAddObjective = () => {
    if (!newObjectiveText.trim()) return;
    setObjectives([...objectives, newObjectiveText.trim()]);
    setNewObjectiveText("");
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!topicOrUrl.trim()) {
      toast.error("Please provide a learning topic or educational content link.");
      setCurrentStep(1);
      return;
    }

    setIsGenerating(true);
    setGenerationStageIndex(0);

    // Realistic progressive stage timer
    const interval = setInterval(() => {
      setGenerationStageIndex((prev) => {
        if (prev < GENERATION_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 750);

    try {
      const journey = await createJourneyMutation.mutateAsync({
        topicOrUrl,
        subject,
        gradeLevel,
        difficulty,
        language,
        mode,
        durationDays,
        learningStyle,
      });

      clearInterval(interval);
      toast.success("Learning Journey successfully synthesized!");
      router.push(`/learn/${journey.id}`);
    } catch (err: unknown) {
      clearInterval(interval);
      setIsGenerating(false);
      toast.error(err instanceof Error ? err.message : "Failed to generate learning journey.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-8">
        {/* Top Header */}
        <div className="space-y-2 text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300">
            <GraduationCap size={13} />
            <span>AI Curriculum Synthesis Wizard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-normal text-slate-950 dark:text-white font-heading">
            Design Your <span className="italic font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Learning Journey</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Transform any concept or video into a structured curriculum with field missions and assessment.
          </p>
        </div>

        {/* Wizard Steps Indicator */}
        {!isGenerating && (
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs font-semibold">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                onClick={() => {
                  if (step < currentStep) setCurrentStep(step);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  currentStep === step
                    ? "bg-indigo-600 text-white shadow-xs"
                    : currentStep > step
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <span>Step {step}</span>
                {currentStep > step && <Check size={13} />}
              </div>
            ))}
          </div>
        )}

        {/* Wizard Form Cards */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
          {isGenerating ? (
            /* Generating State */
            <div className="py-12 px-4 text-center space-y-6 max-w-md mx-auto">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner animate-pulse">
                <Brain size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                  Synthesizing Smart Learning Journey
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium animate-pulse min-h-[2.5rem]">
                  {GENERATION_STEPS[generationStageIndex]}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${((generationStageIndex + 1) / GENERATION_STEPS.length) * 100}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Grounding educational standards with Bloom’s Taxonomy and verified geographic entities.
              </p>
            </div>
          ) : currentStep === 1 ? (
            /* STEP 1: Content or Topic */
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                  1. What do you want to learn?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter an academic topic, historical period, science concept, or paste a video URL.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Search size={14} className="text-indigo-600" />
                    <span>Learning Topic or Source URL</span>
                  </label>
                  <textarea
                    rows={3}
                    value={topicOrUrl}
                    onChange={(e) => setTopicOrUrl(e.target.value)}
                    placeholder="e.g. Indian Freedom Movement in Kolkata, Photosynthesis in Tropical Flora, or https://youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                {/* Quick Suggestion Chips */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Quick Suggestions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Indian Freedom Movement in Kolkata",
                      "The Architecture of the Mughal Empire",
                      "Urban Ecology & Wetland Preservation",
                      "Indian Constitution & Fundamental Rights",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setTopicOrUrl(suggestion)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 transition-all cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => {
                    if (!topicOrUrl.trim()) {
                      toast.error("Please enter a topic or link to proceed.");
                      return;
                    }
                    setCurrentStep(2);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <span>Continue to Profile</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ) : currentStep === 2 ? (
            /* STEP 2: Learner Profile */
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                  2. Learner Profile & Subject
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calibrate the inquiry difficulty and pedagogical tone for the exact learner group.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Grade / Target Level</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option>Class 6</option>
                    <option>Class 7</option>
                    <option>Class 8</option>
                    <option>Class 9</option>
                    <option>Class 10</option>
                    <option>Class 11-12</option>
                    <option>Undergraduate / College</option>
                    <option>General Curious Learner</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject Area</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option>History</option>
                    <option>Science</option>
                    <option>Geography</option>
                    <option>Civics & Political Science</option>
                    <option>Literature & Arts</option>
                    <option>Environmental Studies</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Inquiry Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="beginner">Beginner (Foundational facts & definitions)</option>
                    <option value="intermediate">Intermediate (Contextual analysis & observation)</option>
                    <option value="advanced">Advanced (Critical critique & primary source debate)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Preferred Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Bengali</option>
                    <option>Marathi</option>
                    <option>Tamil</option>
                    <option>Telugu</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Learning Modality</label>
                  <select
                    value={learningStyle}
                    onChange={(e) => setLearningStyle(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="activity_based">Activity & Observation Based</option>
                    <option value="visual">Visual & Architectural</option>
                    <option value="reading">Textual & Archival Reading</option>
                    <option value="multimodal">Multimodal (Balanced)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Duration (Days)</label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value={1}>1 Day (Focused Single Session)</option>
                    <option value={2}>2 Days (Weekend / Multi-Site)</option>
                    <option value={3}>3 Days (Comprehensive Inquiry)</option>
                    <option value={5}>5 Days (Week-Long Curriculum Unit)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-semibold py-2 px-4 rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <span>Review Objectives</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ) : currentStep === 3 ? (
            /* STEP 3: Learning Objectives (Editable) */
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                  3. Learning Objectives
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review and customize the core competencies learners must demonstrate.
                </p>
              </div>

              <div className="space-y-2.5">
                {objectives.map((obj, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs"
                  >
                    <CheckCircle2 size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                    <span className="flex-1 text-slate-800 dark:text-slate-200">{obj}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveObjective(idx)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                {/* Add Custom Objective */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newObjectiveText}
                    onChange={(e) => setNewObjectiveText(e.target.value)}
                    placeholder="Add an additional learning objective..."
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                  <Button
                    type="button"
                    onClick={handleAddObjective}
                    variant="outline"
                    className="text-xs font-semibold py-2 px-3 rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
                  >
                    <Plus size={13} className="mr-1" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-semibold py-2 px-4 rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(4)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <span>Choose Delivery Mode</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ) : (
            /* STEP 4: Journey Delivery Mode */
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                  4. Choose Journey Delivery Mode
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select how learners will physically or digitally interact with this curriculum.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Option 1: Digital */}
                <div
                  onClick={() => setMode("digital")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    mode === "digital"
                      ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <BookOpen size={16} />
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Digital Journey</div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Learn entirely online through interactive digital evidence, multimedia, and quizzes.
                  </p>
                </div>

                {/* Option 2: Explore (Location-Aware) */}
                <div
                  onClick={() => setMode("explore")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    mode === "explore"
                      ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 ring-1 ring-emerald-600"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <MapPin size={16} />
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Local Exploration</div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Connect concepts to nearby heritage sites, city landmarks, and science hubs.
                  </p>
                </div>

                {/* Option 3: Field Journey */}
                <div
                  onClick={() => setMode("travel")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    mode === "travel"
                      ? "border-orange-600 bg-orange-50/50 dark:bg-orange-950/40 ring-1 ring-orange-600"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                    <Compass size={16} />
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Regional Field Tour</div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Multi-day educational excursion with integrated transit route maps and logistics.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                  className="text-xs font-semibold py-2 px-4 rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  onClick={handleGenerate}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all"
                >
                  <Sparkles size={14} />
                  <span>Synthesize Learning Journey</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
