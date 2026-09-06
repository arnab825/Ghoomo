"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  MapPin,
  Sparkles,
  Calendar,
  CheckCircle2,
  Circle,
  HelpCircle,
  MessageSquare,
  ArrowLeft,
  Printer,
  ChevronRight,
  Vote,
  Award,
  Send,
  Loader2,
  Users,
  Compass,
  GraduationCap,
  Layers,
  FileText,
  AlertCircle,
  Bot,
} from "lucide-react";
import {
  useLearningJourney,
  useUpdateActivityStatusMutation,
  useSubmitQuizAnswerMutation,
  useAddReflectionMutation,
} from "@/hooks/useLearningQueries";
import { useToast } from "@/components/shared/ToastContext";
import { Button } from "@/components/ui/button";
import InteractiveMap from "@/components/map/InteractiveMap";
import TeacherDashboard from "@/components/learning/TeacherDashboard";
import LearningReportModal from "@/components/learning/LearningReportModal";
import { askLearningCopilotAction, evaluateReflectionAction } from "@/app/actions/learningActions";
import { Place } from "@/lib/types/ghoomo";

export default function LearningJourneyWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const journeyId = resolvedParams.id;
  const router = useRouter();
  const { data: journey, isLoading } = useLearningJourney(journeyId);
  const { toast } = useToast();

  const updateActivityMutation = useUpdateActivityStatusMutation(journeyId);
  const submitQuizMutation = useSubmitQuizAnswerMutation(journeyId);
  const addReflectionMutation = useAddReflectionMutation(journeyId);

  // View States
  const [activeView, setActiveView] = useState<"learner" | "teacher">("learner");
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(null);
  const [selectedRightTab, setSelectedRightTab] = useState<"map" | "copilot" | "squad" | "objectives">("map");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // In-situ mission submission state
  const [activeSubmissionText, setActiveSubmissionText] = useState<Record<string, string>>({});
  const [isSubmittingMission, setIsSubmittingMission] = useState<Record<string, boolean>>({});

  // Reflection submission state
  const [reflectionInput, setReflectionInput] = useState("");
  const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);

  // Copilot Chat state
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Hello! I am your Ghoomo Learning Copilot. As you explore this journey, ask me anything about the history, architecture, or concepts you observe!",
    },
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // Class Poll State
  const [selectedPollOption, setSelectedPollOption] = useState<number | null>(null);
  const [pollVotes, setPollVotes] = useState<number[]>([14, 22, 8, 4]);

  if (isLoading || !journey) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#090d16] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading Smart Learning Journey...</p>
        </div>
      </div>
    );
  }

  // Convert journey stops to Map Place entities for Leaflet compatibility
  const mapPlaces: Place[] = journey.activities
    .filter((a) => a.coordinates)
    .map((a, idx) => ({
      id: a.placeId || `p-${a.id}`,
      tripId: journey.id,
      name: a.placeName || a.title,
      city: "Kolkata",
      state: "West Bengal",
      lat: a.coordinates!.lat,
      lng: a.coordinates!.lng,
      category: a.type === "observation" ? "viewpoint" : "heritage",
      confidence: 0.98,
      assignedDay: a.dayNumber,
      createdAt: new Date().toISOString(),
    }));

  const filteredActivities = selectedDayFilter
    ? journey.activities.filter((a) => a.dayNumber === selectedDayFilter)
    : journey.activities;

  const handleMissionSubmit = async (activityId: string) => {
    const text = activeSubmissionText[activityId]?.trim();
    if (!text) {
      toast.error("Please enter your observation or evidence before submitting.");
      return;
    }

    setIsSubmittingMission({ ...isSubmittingMission, [activityId]: true });
    try {
      // Evaluate observation with AI feedback
      const evalResult = await evaluateReflectionAction(
        "Observation Mission Evidence",
        text,
        journey.gradeLevel
      );

      await updateActivityMutation.mutateAsync({
        activityId,
        status: "completed",
        submission: {
          text,
          aiFeedback: evalResult.feedback,
          score: evalResult.score || 90,
        },
      });

      toast.success("Mission completed! AI feedback received.");
    } catch (err) {
      toast.error("Failed to submit observation.");
    } finally {
      setIsSubmittingMission({ ...isSubmittingMission, [activityId]: false });
    }
  };

  const handleQuizChoice = async (activityId: string, questionId: string, option: string) => {
    const res = await submitQuizMutation.mutateAsync({
      activityId,
      questionId,
      selectedAnswer: option,
    });

    if (res.isCorrect) {
      toast.success("Correct answer! Great observation.");
    } else {
      toast.error("Incorrect. Check the explanation to learn why!");
    }
  };

  const handleReflectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionInput.trim()) return;

    setIsSubmittingReflection(true);
    try {
      const evalResult = await evaluateReflectionAction(
        "Synthesis Reflection",
        reflectionInput.trim(),
        journey.gradeLevel
      );

      await addReflectionMutation.mutateAsync({
        prompt: "Final Synthesis & Personal Perspective",
        studentResponse: reflectionInput.trim(),
        aiFeedback: evalResult.feedback,
      });

      setReflectionInput("");
      toast.success("Reflection recorded with AI feedback!");
    } catch (err) {
      toast.error("Failed to save reflection.");
    } finally {
      setIsSubmittingReflection(false);
    }
  };

  const handleAskCopilot = async (messageText?: string) => {
    const query = messageText || copilotInput.trim();
    if (!query) return;

    setCopilotMessages((prev) => [...prev, { role: "user", text: query }]);
    if (!messageText) setCopilotInput("");
    setIsCopilotThinking(true);

    try {
      const res = await askLearningCopilotAction({
        journeyTitle: journey.title,
        subject: journey.subject,
        gradeLevel: journey.gradeLevel,
        currentStopName: mapPlaces[0]?.name || "Victoria Memorial",
        userMessage: query,
      });

      setCopilotMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.answer || "I am analyzing this observation." },
      ]);
    } catch {
      setCopilotMessages((prev) => [
        ...prev,
        { role: "assistant", text: "I could not retrieve an answer right now. Please try again." },
      ]);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  const handlePollVote = (index: number) => {
    if (selectedPollOption !== null) return;
    setSelectedPollOption(index);
    const nextVotes = [...pollVotes];
    nextVotes[index] += 1;
    setPollVotes(nextVotes);
    toast.success("Your vote has been counted!");
  };

  const mastery = journey.progress?.masteryPercentage || 0;

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200 pb-16">
      {/* Workspace Top Bar */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/80 dark:border-slate-800 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/learn"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0"
              title="Return to Journeys"
            >
              <ArrowLeft size={16} />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {journey.gradeLevel}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {journey.subject}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  • {journey.durationDays} Days • {journey.activities.length} Missions
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {journey.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Mastery Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs">
              <span className="text-slate-500">Mastery:</span>
              <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all"
                  style={{ width: `${mastery}%` }}
                />
              </div>
              <span className="font-mono font-bold text-emerald-600">{mastery}%</span>
            </div>

            {/* View Switcher: Learner vs Teacher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveView("learner")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeView === "learner"
                    ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Learner View
              </button>
              <button
                type="button"
                onClick={() => setActiveView("teacher")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeView === "teacher"
                    ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Teacher View
              </button>
            </div>

            {/* Export Report Trigger */}
            <Button
              onClick={() => setIsReportModalOpen(true)}
              variant="outline"
              className="text-xs font-semibold py-1.5 px-3 rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer flex items-center gap-1.5"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Export Report</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        {activeView === "teacher" ? (
          <TeacherDashboard journey={journey} onOpenReport={() => setIsReportModalOpen(true)} />
        ) : (
          /* Dual-Pane Learner Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT / CENTER PANE: Curriculum & Activity Timeline (7 Columns) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Day Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedDayFilter(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedDayFilter === null
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  All Days ({journey.activities.length})
                </button>
                {Array.from({ length: journey.durationDays }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const count = journey.activities.filter((a) => a.dayNumber === dayNum).length;
                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => setSelectedDayFilter(dayNum)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedDayFilter === dayNum
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      Day {dayNum} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Activity Timeline Cards */}
              <div className="space-y-4">
                {filteredActivities.map((act) => {
                  const isDone = act.status === "completed";
                  return (
                    <div
                      key={act.id}
                      className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 space-y-3.5 transition-all shadow-2xs ${
                        isDone
                          ? "border-emerald-200/80 dark:border-emerald-950/60"
                          : "border-slate-200/90 dark:border-slate-800"
                      }`}
                    >
                      {/* Activity Stage Badge + Title */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                act.stage === "before"
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                  : act.stage === "during"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              Stage: {act.stage}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-slate-400">
                              Day {act.dayNumber} • {act.type} • {act.durationMinutes} mins
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {act.title}
                          </h3>
                        </div>

                        {isDone ? (
                          <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold shrink-0">
                            <CheckCircle2 size={16} />
                            <span>Completed</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono shrink-0">Pending</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {act.description}
                      </p>

                      {/* Location Anchor */}
                      {act.placeName && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                          <MapPin size={12} />
                          <span>Field Stop: {act.placeName}</span>
                        </div>
                      )}

                      {/* Instructions / Thinking Prompt */}
                      {act.instruction && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">
                            Mission Instructions:
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">{act.instruction}</p>
                          {act.thinkingPrompt && (
                            <p className="text-indigo-600 dark:text-indigo-400 italic pt-1 text-[11px]">
                              💡 Question to ponder: {act.thinkingPrompt}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Quiz Component if Type is Quiz */}
                      {act.quizQuestions && act.quizQuestions.length > 0 && (
                        <div className="pt-2 space-y-3">
                          <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            In-Situ Checkpoint Questions:
                          </div>
                          {act.quizQuestions.map((q) => (
                            <div
                              key={q.id}
                              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 space-y-2.5 text-xs"
                            >
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {q.question}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.options?.map((opt) => {
                                  const isSelected = q.selectedAnswer === opt;
                                  const isCorrect = isSelected && opt === q.correctAnswer;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => handleQuizChoice(act.id, q.id, opt)}
                                      className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all cursor-pointer ${
                                        isSelected
                                          ? isCorrect
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold"
                                            : "border-rose-500 bg-rose-50 text-rose-900 font-bold"
                                          : "border-slate-200 bg-white hover:border-indigo-300 text-slate-700"
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                              {q.selectedAnswer && (
                                <div className="text-[11px] text-slate-500 pt-1">
                                  <span className="font-bold">Explanation:</span> {q.explanation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Observation Evidence Submission Box (for Observation & Mission types) */}
                      {(act.type === "observation" || act.type === "mission") && !isDone && (
                        <div className="space-y-2 pt-2">
                          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Submit Your Field Observation / Evidence:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={activeSubmissionText[act.id] || ""}
                              onChange={(e) =>
                                setActiveSubmissionText({
                                  ...activeSubmissionText,
                                  [act.id]: e.target.value,
                                })
                              }
                              placeholder="Describe what you see or notice at this stop..."
                              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                            />
                            <Button
                              type="button"
                              disabled={isSubmittingMission[act.id]}
                              onClick={() => handleMissionSubmit(act.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl cursor-pointer"
                            >
                              {isSubmittingMission[act.id] ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <span>Submit Evidence</span>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Submitted Feedback Display */}
                      {act.submission && (
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-1">
                          <div className="font-semibold text-emerald-900">
                            Your Observation: "{act.submission.text}"
                          </div>
                          {act.submission.aiFeedback && (
                            <div className="text-emerald-800 text-[11px]">
                              <span className="font-bold">AI Mentor:</span> {act.submission.aiFeedback}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Final Stage: Reflection Box */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 space-y-3 text-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase">
                    <Award size={15} />
                    <span>Stage 5 • Final Reflection & Synthesis</span>
                  </div>
                  <p className="text-slate-700">
                    What is one critical insight about colonial power or revolutionary resistance that you understood only by standing in front of these actual physical places, which a textbook could not convey?
                  </p>
                  <form onSubmit={handleReflectionSubmit} className="space-y-2">
                    <textarea
                      rows={3}
                      value={reflectionInput}
                      onChange={(e) => setReflectionInput(e.target.value)}
                      placeholder="Write your reflection here..."
                      className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <Button
                      type="submit"
                      disabled={isSubmittingReflection || !reflectionInput.trim()}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer"
                    >
                      {isSubmittingReflection ? "Evaluating..." : "Submit Reflection for AI Feedback"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>

            {/* RIGHT PANE: Contextual Intelligence (5 Columns) */}
            <div className="lg:col-span-5 space-y-4 sticky top-36">
              {/* Tab Selector */}
              <div className="flex items-center justify-between p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedRightTab("map")}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    selectedRightTab === "map"
                      ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Field Map
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRightTab("copilot")}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    selectedRightTab === "copilot"
                      ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  AI Copilot
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRightTab("squad")}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    selectedRightTab === "squad"
                      ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Squad & Poll
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRightTab("objectives")}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    selectedRightTab === "objectives"
                      ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Objectives
                </button>
              </div>

              {/* Tab 1: Map View */}
              {selectedRightTab === "map" && (
                <div className="rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-2xs space-y-3 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin size={13} className="text-emerald-600" />
                      <span>{mapPlaces.length} Educational Stops Mapped</span>
                    </span>
                    <span className="text-[11px] text-slate-500">OpenStreetMap GPS</span>
                  </div>
                  <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <InteractiveMap places={mapPlaces} durationDays={journey.durationDays} />
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div>📍 Victoria Memorial • 📍 Indian Museum • 📍 College Street • 📍 Netaji Bhawan</div>
                  </div>
                </div>
              )}

              {/* Tab 2: Learning Copilot */}
              {selectedRightTab === "copilot" && (
                <div className="rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs flex flex-col h-96 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Bot size={15} className="text-indigo-600" />
                      <span>Ghoomo Learning Copilot</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Class 8 History AI
                    </span>
                  </div>

                  {/* Message History */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 text-xs pr-1">
                    {copilotMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-xl ${
                          msg.role === "assistant"
                            ? "bg-indigo-50/70 text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-200 border border-indigo-100"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white ml-6"
                        }`}
                      >
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    ))}
                    {isCopilotThinking && (
                      <div className="p-2 text-xs text-slate-400 italic flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Copilot is formulating pedagogical guidance...</span>
                      </div>
                    )}
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "Explain this like Class 8",
                      "Why is this place important?",
                      "What should I look for here?",
                      "Quiz me on this",
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleAskCopilot(chip)}
                        className="text-[10px] px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Input Box */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <input
                      type="text"
                      value={copilotInput}
                      onChange={(e) => setCopilotInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAskCopilot();
                      }}
                      placeholder="Ask Copilot a question..."
                      className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAskCopilot()}
                      className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Squad & Interactive Class Poll */}
              {selectedRightTab === "squad" && (
                <div className="rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 space-y-4 shadow-2xs text-xs">
                  {/* Class Poll */}
                  <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                      <Vote size={14} />
                      <span>Class Poll: Active Discussion</span>
                    </div>
                    <p className="text-slate-800">
                      "Which factor had the greatest influence on sparking the Bengal Renaissance?"
                    </p>
                    <div className="space-y-1.5">
                      {[
                        "English education & Hindu College",
                        "Indigenous printing presses on College Street",
                        "Subhash Bose & armed resistance",
                        "Aesthetic arts & Shantiniketan",
                      ].map((opt, idx) => {
                        const total = pollVotes.reduce((a, b) => a + b, 0);
                        const pct = Math.round((pollVotes[idx] / total) * 100);
                        const isChosen = selectedPollOption === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => handlePollVote(idx)}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden ${
                              isChosen ? "border-indigo-600 bg-white font-bold" : "border-slate-200 bg-white/70"
                            }`}
                          >
                            <div className="flex justify-between relative z-10">
                              <span>{opt}</span>
                              <span className="font-mono text-slate-500">{pct}%</span>
                            </div>
                            <div
                              className="absolute top-0 left-0 bottom-0 bg-indigo-100 opacity-60 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Learning Squad List */}
                  <div className="space-y-2">
                    <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Learning Squad (Class 8B)
                    </div>
                    {journey.squad.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">{member.name}</span>
                            <span className="ml-1.5 text-[10px] text-slate-400 capitalize">({member.role})</span>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-indigo-600">
                          {member.progressPercentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Curriculum Objectives */}
              {selectedRightTab === "objectives" && (
                <div className="rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 space-y-3 shadow-2xs text-xs">
                  <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Curriculum Competencies (Bloom's Taxonomy)
                  </div>
                  <div className="space-y-2">
                    {journey.objectives.map((obj) => (
                      <div key={obj.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {obj.bloomsLevel}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{obj.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PDF / Print Learning Report Modal */}
      <LearningReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        journey={journey}
      />
    </div>
  );
}
