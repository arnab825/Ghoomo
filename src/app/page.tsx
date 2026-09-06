"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";
import { TRIP_KEYS } from "@/hooks/useTripQueries";
import {
  Compass,
  Sparkles,
  Link as LinkIcon,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  Share2,
  DollarSign,
  CheckSquare,
  Play,
  Loader2,
  AlertCircle,
  X,
  Music,
  Type,
  Video,
  Globe,
  Zap,
  TrendingUp,
  Layers,
  Bot,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { tripService } from "@/lib/services/tripService";
import { Button } from "@/components/ui/button";
import { SAMPLE_REELS_CATALOG } from "@/lib/video-pipeline/sampleReelsCatalog";

const PIPELINE_STAGES = [
  { key: "DOWNLOADING", label: "Video stream received & cached" },
  { key: "PROCESSING_VIDEO", label: "Multimodal AI analyzing audio & visuals" },
  { key: "EXTRACTING_EVIDENCE", label: "Extracting landmarks, signs & OCR text" },
  { key: "RESOLVING_DESTINATION", label: "Resolving destination & entity coordinates" },
  { key: "OPTIMIZING_TRIP", label: "Geo-clustering & nearest-neighbor scheduling" },
  { key: "GENERATING_ITINERARY", label: "Generating structured itinerary with provenance" },
  { key: "VALIDATING", label: "Deterministic validation, budget & checklist" },
];

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, deductCredits } = useAuthStore();

  const [pastedUrl, setPastedUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>("IDLE");
  const [currentStageMessage, setCurrentStageMessage] = useState<string>("");
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [candidateDestinations, setCandidateDestinations] = useState<
    Array<{ name: string; confidence: number; country?: string }>
  >([]);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const startJobPolling = (jobId: string) => {
    setActiveJobId(jobId);
    setIsLoading(true);
    setError(null);

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();

        setJobStatus(data.status);
        setCurrentStageMessage(data.message || "");

        const stageOrder = PIPELINE_STAGES.map((s) => s.key);
        const currentIdx = stageOrder.indexOf(data.status);
        if (currentIdx >= 0) {
          setCompletedStages(stageOrder.slice(0, currentIdx));
        }

        if (data.status === "NEEDS_CONFIRMATION") {
          setCandidateDestinations(data.destination_candidates || []);
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          return;
        }

        if (data.status === "READY") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setCompletedStages(stageOrder);
          deductCredits(1);

          if (data.trip) {
            tripService.saveLocalTrip(data.trip);
            queryClient.setQueryData(TRIP_KEYS.detail(data.trip.id), data.trip);
            queryClient.invalidateQueries({ queryKey: TRIP_KEYS.all });
            router.push(`/trips/${data.trip.id}`);
          }
        }

        if (data.status === "FAILED") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setIsLoading(false);
          setJobStatus("FAILED");
          setError(data.error || "Video could not be processed. Try a public video URL.");
        }
      } catch (pollErr) {
        console.warn("[HomePage] Polling error:", pollErr);
      }
    }, 1200);
  };

  const handleStartDirectExtraction = async (urlToUse?: string) => {
    const importUrl = (urlToUse || pastedUrl).trim();
    if (!importUrl) {
      setError("Please paste a link to an Instagram Reel, TikTok, YouTube Short, or travel blog.");
      return;
    }

    if ((currentUser.credits ?? 9) < 1) {
      setError("You need 1 credit to extract places from a travel link. Please top up your credits.");
      return;
    }

    setPastedUrl(importUrl);
    setIsLoading(true);
    setError(null);
    setCompletedStages([]);
    setCandidateDestinations([]);
    setJobStatus("DOWNLOADING");
    setCurrentStageMessage("Initiating video ingestion & cache...");

    try {
      const res = await fetch("/api/trips/from-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: importUrl,
          preferences: {
            pace: "balanced",
            travellers: 2,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.job_id) {
        throw new Error(data.error || "Failed to initialize video processing.");
      }

      startJobPolling(data.job_id);
    } catch (err: any) {
      setIsLoading(false);
      setJobStatus("IDLE");
      setError(err.message || "Unable to start video processing.");
    }
  };

  const handleConfirmDestination = async (chosenDestination: string) => {
    if (!activeJobId) return;
    setIsLoading(true);
    setCandidateDestinations([]);

    try {
      const res = await fetch(`/api/jobs/${activeJobId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: chosenDestination }),
      });

      if (!res.ok) throw new Error("Failed to confirm destination.");
      startJobPolling(activeJobId);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || "Failed to confirm destination.");
    }
  };

  const handleCancel = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setIsLoading(false);
    setJobStatus("IDLE");
    setError(null);
    setActiveJobId(null);
    setCompletedStages([]);
    setCandidateDestinations([]);
  };

  const currentProgressPercent = Math.min(
    95,
    Math.max(15, Math.round(((completedStages.length + 1) / (PIPELINE_STAGES.length + 1)) * 100))
  );

  return (
    <div className="flex flex-col gap-20 pb-24 overflow-hidden relative">
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* 1. HERO & DIRECT SOCIAL URL EXTRACTOR */}
      <section className="relative pt-12 sm:pt-24 px-4 sm:px-6">
        {/* Animated Glow Orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-teal-500/15 rounded-full blur-[140px] pointer-events-none animate-float-slow" />
        <div className="absolute top-28 right-10 w-[450px] h-[300px] bg-orange-500/15 rounded-full blur-[120px] pointer-events-none animate-float-slow-reverse" />
        <div className="absolute top-40 left-10 w-[350px] h-[250px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none animate-float-slow" />

        <div className="container mx-auto max-w-5xl space-y-9 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 px-4 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 shadow-sm backdrop-blur-md hover:border-teal-500/50 transition-all duration-300 group cursor-default">
            <Sparkles size={14} className="text-teal-600 dark:text-teal-400 group-hover:rotate-12 transition-transform duration-300" />
            <span className="tracking-wide">AI-Powered Social Travel Intelligence</span>
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
          </div>

          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-slate-900 dark:text-white font-heading leading-[1.05]">
              Stop Saving Reels. <br />
              <span className="italic bg-gradient-to-r from-teal-600 via-teal-500 to-orange-500 bg-clip-text text-transparent drop-shadow-xs">
                Start Traveling India & Beyond.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              Paste any Instagram Reel, TikTok, YouTube Short, or travel blog link.
              Ghoomo extracts verified places, pins them on interactive maps,
              and auto-clusters smart day-wise itineraries in seconds.
            </p>
          </div>

          {/* DIRECT INLINE SOCIAL URL EXTRACTOR CARD */}
          <div className="max-w-3xl mx-auto rounded-2xl border border-teal-500/20 bg-white/90 p-4 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur-xl ring-1 ring-slate-950/5 text-left transition-all duration-300 hover:border-teal-500/40 hover:shadow-teal-500/10">
            {!isLoading && candidateDestinations.length === 0 ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1 group">
                    <LinkIcon
                      size={18}
                      className="absolute left-4 top-4 text-slate-400 group-focus-within:text-teal-600 transition-colors"
                    />
                    <input
                      type="url"
                      value={pastedUrl}
                      onChange={(e) => {
                        setPastedUrl(e.target.value);
                        setError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleStartDirectExtraction();
                        }
                      }}
                      placeholder="Paste Reel, TikTok, YouTube Short, or travel blog URL..."
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 dark:bg-slate-950/80 dark:border-slate-800 dark:text-white transition-all shadow-inner"
                    />
                  </div>

                  <Button
                    onClick={() => handleStartDirectExtraction()}
                    disabled={!pastedUrl.trim()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm px-7 py-3.5 rounded-xl enabled:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] shrink-0 group"
                  >
                    <span>Smart Trip Plan</span>
                    <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle size={16} className="shrink-0 text-rose-500" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-teal-600 shrink-0" />
                    <span>Multimodal AI: Speech, OCR, Visuals & Landmarks</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <Zap size={12} className="text-orange-500" /> Fast Execution
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-teal-600" /> 100% Verified
                    </span>
                  </div>
                </div>

                {/* SAMPLE REELS QUICK DEMO SELECTOR */}
                <div className="pt-3 space-y-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Play size={12} className="text-orange-500 fill-orange-500" />
                      Try with a sample social reel:
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Click to test instantly</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {SAMPLE_REELS_CATALOG.slice(0, 5).map((reel) => (
                      <button
                        key={reel.id}
                        type="button"
                        onClick={() => handleStartDirectExtraction(reel.url)}
                        className="group flex flex-col justify-between p-2 rounded-lg border border-slate-200/80 bg-slate-50/70 hover:bg-teal-50/80 hover:border-teal-500/50 dark:bg-slate-950/50 dark:border-slate-800 dark:hover:bg-slate-800/80 text-left transition-all duration-200 cursor-pointer active:scale-[0.97]"
                      >
                        <div className="relative h-14 w-full rounded-md overflow-hidden mb-1.5 bg-slate-200 dark:bg-slate-800">
                          <img
                            src={reel.thumbnailUrl}
                            alt={reel.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="h-6 w-6 rounded-full bg-white/90 text-teal-700 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                              <Play size={11} className="fill-teal-700 ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                            {reel.title.split(" ")[0]} {reel.title.split(" ")[1]}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 block truncate">
                            {reel.category}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : candidateDestinations.length > 0 ? (
              /* Seasonal / Multi-Destination Confirmation Screen */
              <div className="p-4 space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Multi-Destination Listicle Detected
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white font-heading">
                    Which destination would you like to build an itinerary for?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This video recommends multiple locations. Select your target region to generate a day-wise itinerary:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {candidateDestinations.map((cand) => (
                    <button
                      key={cand.name}
                      type="button"
                      onClick={() => handleConfirmDestination(cand.name)}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 bg-slate-50/80 hover:bg-teal-50/60 dark:bg-slate-950 dark:border-slate-800 dark:hover:border-teal-500/50 transition-all group cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0 group-hover:bg-teal-500/20 transition-colors">
                          <MapPin size={18} />
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {cand.name}
                          </span>
                          {cand.country && (
                            <p className="text-[11px] text-slate-500">{cand.country}</p>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium px-3.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Active Live Multi-Stage Processing Widget */
              <div className="p-4 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-teal-500/20 text-orange-600 border border-orange-500/30 flex items-center justify-center shrink-0 animate-pulse shadow-xs">
                      <Video size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Analyzing Travel Video with Multimodal AI</span>
                        <Loader2 size={14} className="animate-spin text-orange-500" />
                      </h3>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate max-w-sm sm:max-w-md">
                        {pastedUrl}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
                    title="Cancel processing"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                      <Sparkles size={13} className="animate-spin text-orange-500" />
                      {currentStageMessage || "Extracting landmarks & scheduling..."}
                    </span>
                    <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                      {currentProgressPercent}%
                    </span>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 via-teal-500 to-emerald-500 transition-all duration-500 rounded-full"
                      style={{ width: `${currentProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Pipeline Stage Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {PIPELINE_STAGES.slice(0, 4).map((st) => {
                    const isDone = completedStages.includes(st.key);
                    const isCurrent = jobStatus === st.key;
                    return (
                      <div
                        key={st.key}
                        className={`flex items-center gap-2 p-2.5 rounded-xl text-[11px] font-medium border transition-all ${
                          isDone
                            ? "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/40 dark:border-teal-900 dark:text-teal-300"
                            : isCurrent
                            ? "bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-950/40 dark:border-orange-900 dark:text-orange-300 animate-pulse shadow-sm"
                            : "bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-950/40 dark:border-slate-800"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 size={13} className="text-teal-600 shrink-0" />
                        ) : isCurrent ? (
                          <Loader2 size={13} className="animate-spin text-orange-500 shrink-0" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                        )}
                        <span className="truncate">{st.label.split(" ")[0]} {st.label.split(" ")[1]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. STATS & CAPABILITY HIGHLIGHTS */}
      <section className="px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { label: "Landmark Extraction", value: "98.4%", desc: "High accuracy visual OCR & speech recognition", icon: Sparkles },
              { label: "Indian Places Reference", value: "10,000+", desc: "Verified Indian coordinates & state metadata", icon: MapPin },
              { label: "Geo Route Optimization", value: "Instant", desc: "No zigzagging across Indian city traffic", icon: Navigation },
              { label: "Collaborative Workspace", value: "1-Click", desc: "Share link with friends to vote & budget", icon: Users },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 sm:p-6 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/60 shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {stat.value}
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-teal-50 dark:bg-slate-800 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    {stat.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {stat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. HOW GHOOMO WORKS (4 STEPS) */}
      <section className="px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
              The Core Problem & Solution
            </span>
            <h2 className="text-3xl sm:text-5xl font-normal text-slate-900 dark:text-white font-heading">
              From Scattered Saved Links to a Master Day-Wise Plan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Transform unstructured travel videos into clean, actionable day-by-day itineraries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              {
                step: "01",
                title: "Add from Reel, Short, or Blog",
                desc: "Drop in any Instagram Reel, TikTok, YouTube Short, or travel blog URL. Zero manual entry.",
                icon: LinkIcon,
                color: "text-orange-500 bg-orange-50 dark:bg-slate-800 border-orange-200 dark:border-slate-700",
              },
              {
                step: "02",
                title: "Extract Verified Places",
                desc: "Multimodal AI extracts coordinates, audio transcript mentions, and landmark visual evidence.",
                icon: MapPin,
                color: "text-teal-600 bg-teal-50 dark:bg-slate-800 border-teal-200 dark:border-slate-700",
              },
              {
                step: "03",
                title: "Geo-Clustered Schedule",
                desc: "Nearest-neighbor engine clusters stops into optimized daily routes to save travel time.",
                icon: Compass,
                color: "text-emerald-600 bg-emerald-50 dark:bg-slate-800 border-emerald-200 dark:border-slate-700",
              },
              {
                step: "04",
                title: "Plan & Split with Friends",
                desc: "Invite trip members via shareable link to vote on places, track expenses, and check packing lists.",
                icon: Users,
                color: "text-cyan-600 bg-cyan-50 dark:bg-slate-800 border-cyan-200 dark:border-slate-700",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.step}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 space-y-4 relative hover:border-teal-500/50 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/60 backdrop-blur-md shadow-xs flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                        STEP {card.step}
                      </span>
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={20} />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. REAL VOICE AI & MULTIMODAL ARCHITECTURE */}
      <section className="px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                100% Real Speech & Visual AI Extraction
              </span>
              <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 dark:text-white font-heading">
                Voice-Driven Travel Intelligence Engine
              </h2>
            </div>
            <Link href="/trips" className="cursor-pointer shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-slate-700 hover:text-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer active:scale-95 transition-all"
              >
                <span>View All Workspaces</span>
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: "Voice Audio Transcripts",
                desc: "Captures spoken speech from YouTube timed-text and Instagram audio streams to extract real travel spots.",
                badge: "AI Speech-to-Text",
                icon: Sparkles,
              },
              {
                title: "Location Verification",
                desc: "If no geographic destination is spoken, Ghoomo alerts you directly instead of generating fake mock places.",
                badge: "Zero Mock Data",
                icon: MapPin,
              },
              {
                title: "Days & Budget Synthesis",
                desc: "Spoken durations and budgets are prioritized; otherwise AI computes ideal INR budgets and trip days.",
                badge: "Smart Calculation",
                icon: DollarSign,
              },
              {
                title: "100% Free OpenStreetMap",
                desc: "Global open-source Leaflet map with zero tile watermarks, instant routing, and interactive markers.",
                badge: "Free & Open Source",
                icon: Compass,
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group rounded-2xl border border-slate-200/80 bg-white/80 p-5 space-y-4 hover:border-teal-500/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shadow-xs flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900/60 backdrop-blur-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-slate-800 text-teal-600 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors duration-300">
                        <Icon size={19} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800">
                        {feature.badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl rounded-3xl border border-teal-500/30 bg-gradient-to-br from-teal-950 via-slate-950 to-slate-900 p-8 sm:p-16 text-center space-y-7 relative overflow-hidden shadow-2xl text-white">
          {/* Ambient Glow Circles */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="space-y-3 max-w-2xl mx-auto relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles size={13} /> Ready in 30 Seconds
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-normal text-white font-heading leading-tight">
              Ready to Turn Social Links into Real Trips?
            </h2>
            <p className="text-xs sm:text-base text-slate-300 leading-relaxed">
              Create your first trip workspace in seconds. Plan with friends, track shared budget expenses, and explore interactive maps.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 relative z-10 max-w-md mx-auto">
            <Link href="/trips/new" className="cursor-pointer w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm px-7 py-3.5 rounded-xl cursor-pointer shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                <span>Create Free Trip</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/auth" className="cursor-pointer w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-white/20 bg-white/10 text-white hover:bg-white/20 text-sm px-6 py-3.5 rounded-xl cursor-pointer active:scale-[0.98] transition-all duration-200 backdrop-blur-md"
              >
                Switch Demo Persona
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

