"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  MapPin,
  Sparkles,
  Plus,
  Compass,
  CheckCircle2,
  Trash2,
  Calendar,
  Layers,
  GraduationCap,
  Award,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useLearningJourneys, useDeleteJourneyMutation } from "@/hooks/useLearningQueries";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/ToastContext";
import { LearningMode } from "@/lib/types/learning";

export default function LearningDashboardPage() {
  const router = useRouter();
  const { data: journeys = [], isLoading } = useLearningJourneys();
  const deleteJourneyMutation = useDeleteJourneyMutation();
  const { toast, confirmModal } = useToast();

  const [selectedModeFilter, setSelectedModeFilter] = useState<string>("all");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");

  const filteredJourneys = journeys.filter((j) => {
    if (selectedModeFilter !== "all" && j.mode !== selectedModeFilter) return false;
    if (selectedSubjectFilter !== "all" && j.subject.toLowerCase() !== selectedSubjectFilter.toLowerCase()) return false;
    return true;
  });

  const handleDeleteJourney = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    confirmModal({
      title: "Delete Learning Journey",
      message: `Are you sure you want to delete "${title}"? All student submissions and progress will be removed.`,
      confirmText: "Delete Journey",
      variant: "danger",
      onConfirm: async () => {
        await deleteJourneyMutation.mutateAsync(id);
        toast.success(`"${title}" deleted successfully.`);
      },
    });
  };

  // Aggregated Stats
  const totalActivitiesCount = journeys.reduce((sum, j) => sum + (j.activities?.length || 0), 0);
  const avgMastery =
    journeys.length > 0
      ? Math.round(
          journeys.reduce((sum, j) => sum + (j.progress?.masteryPercentage || 0), 0) / journeys.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-800 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300">
              <GraduationCap size={13} />
              <span>Smart Education Workspaces</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal text-slate-950 dark:text-white font-heading">
              Your <span className="italic font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Learning Journeys</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Personalized, inquiry-driven digital lessons and field-based observation journeys.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/learn/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center gap-1.5">
                <Plus size={15} />
                <span>New Learning Journey</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Learning Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Journeys</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{journeys.length}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Missions</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">{totalActivitiesCount}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Average Mastery</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{avgMastery}%</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Flagship Demo</div>
            <Link
              href="/learn/kolkata-heritage-demo"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1"
            >
              <span>Kolkata Heritage</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
            {["all", "digital", "explore"].map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedModeFilter(mode)}
                className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  selectedModeFilter === mode
                    ? "bg-white text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                {mode === "all" ? "All Modes" : mode === "digital" ? "Digital" : "Location-Aware"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Subject:</span>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">All Subjects</option>
              <option value="History">History</option>
              <option value="Science">Science</option>
              <option value="Geography">Geography</option>
              <option value="Civics">Civics</option>
              <option value="Literature">Literature</option>
            </select>
          </div>
        </div>

        {/* Journeys Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading your learning journeys...</div>
        ) : filteredJourneys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-4 max-w-md mx-auto dark:border-slate-800 dark:bg-slate-900/60">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <BookOpen size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No journeys found</h3>
            <p className="text-xs text-slate-500">
              Create your first AI-structured learning journey or launch the pre-seeded Kolkata Heritage demo.
            </p>
            <Link href="/learn/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                Create First Journey
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJourneys.map((journey) => {
              const mastery = journey.progress?.masteryPercentage || 0;
              const completedCount = journey.progress?.completedActivityIds?.length || 0;
              const totalCount = journey.activities?.length || 0;

              return (
                <div
                  key={journey.id}
                  onClick={() => router.push(`/learn/${journey.id}`)}
                  className="group rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  {/* Cover Header */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <img
                      src={journey.coverImage}
                      alt={journey.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-white/95 text-slate-900 dark:bg-slate-900/90 dark:text-slate-200 shadow-xs backdrop-blur-md">
                        {journey.gradeLevel}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                        {journey.subject}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteJourney(e, journey.id, journey.title)}
                        className="p-1.5 rounded-lg bg-white/85 hover:bg-white text-slate-600 hover:text-rose-600 dark:bg-slate-900/85 dark:text-slate-400 dark:hover:text-rose-400 transition-all cursor-pointer shadow-xs"
                        title="Delete journey"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                      <span className="flex items-center gap-1 font-medium drop-shadow-xs">
                        {journey.mode === "explore" ? (
                          <>
                            <MapPin size={13} className="text-emerald-400" /> Location-Aware
                          </>
                        ) : (
                          <>
                            <BookOpen size={13} className="text-indigo-300" /> Digital Inquiry
                          </>
                        )}
                      </span>
                      <span className="text-slate-200 font-mono text-[11px]">
                        {journey.durationDays} Days
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                        {journey.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {journey.description}
                      </p>
                    </div>

                    {/* Progress Bar & Competencies */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-600 dark:text-slate-400">Mastery Progress</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-mono">{mastery}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${mastery}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{completedCount} of {totalCount} missions done</span>
                        <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          <span>Open</span>
                          <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
