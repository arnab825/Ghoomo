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
      setError("Please paste a link to an Instagram Reel, YouTube Short, or travel video.");
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
    <div className="flex flex-col gap-16 pb-20 overflow-hidden">
      {/* 1. HERO & DIRECT SOCIAL URL EXTRACTOR */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6">
        {/* Ambient Subtle Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-5xl space-y-7 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-600/20 bg-teal-600/10 px-4 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
            <Sparkles size={14} />
            <span>Turn Social Travel Inspiration into Real Indian Trips</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-7xl font-normal tracking-tight text-slate-900 dark:text-white font-heading leading-[1.08]">
            Stop Saving Reels. <br />
            <span className="italic bg-linear-to-r from-teal-600 via-teal-700 to-orange-500 bg-clip-text text-transparent">
              Start Traveling India.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Paste any Instagram Reel, TikTok, YouTube Short, or travel blog.
            Ghoomo extracts verified Indian places, pins them on Light Matter
            maps, and auto-generates smart day-wise routes.
          </p>

          {/* DIRECT INLINE SOCIAL URL EXTRACTOR */}
          <div className="max-w-3xl mx-auto rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900/95 ring-1 ring-slate-950/5 text-left transition-all">
            {!isLoading && candidateDestinations.length === 0 ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <LinkIcon
                      size={18}
                      className="absolute left-3.5 top-3.5 text-slate-400"
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
                      placeholder="Paste Instagram Reel, TikTok, YouTube Short, or blog link..."
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-saffron-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                    />
                  </div>

                  <Button
                    onClick={() => handleStartDirectExtraction()}
                    disabled={!pastedUrl.trim()}
                    className="bg-linear-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-semibold text-sm px-6 py-3 rounded-lg enabled:cursor-pointer disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 transition-all duration-100 active:scale-[0.98] shrink-0"
                  >
                    <span>Smart trip plan</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs">
                    <AlertCircle size={15} className="shrink-0 text-rose-500" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <Sparkles size={12} className="text-teal-600 shrink-0" />
                  <span>Native Multimodal Video Understanding — Visuals, OCR text, Audio, Landmarks & Duration.</span>
                </div>
              </div>
            ) : candidateDestinations.length > 0 ? (
              /* Seasonal / Multi-Destination Confirmation Screen */
              <div className="p-4 space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-saffron-600 dark:text-saffron-400 flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Seasonal Recommendation Listicle Detected
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white font-heading">
                    Which destination would you like to build an itinerary for?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This travel video recommends multiple regions. Choose one to generate your day-wise schedule:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {candidateDestinations.map((cand) => (
                    <button
                      key={cand.name}
                      type="button"
                      onClick={() => handleConfirmDestination(cand.name)}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-saffron-500 bg-slate-50 hover:bg-saffron-50 dark:bg-slate-950 dark:border-slate-800 dark:hover:border-saffron-500/50 transition-all group enabled:cursor-pointer disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-saffron-500/10 text-saffron-600 flex items-center justify-center shrink-0">
                          <MapPin size={16} />
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-saffron-600 transition-colors">
                            {cand.name}
                          </span>
                          {cand.country && (
                            <p className="text-[11px] text-slate-500">{cand.country}</p>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={15} className="text-slate-400 group-hover:text-saffron-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Active Live Multi-Stage Processing Widget */
              <div className="p-4 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-linear-to-br from-saffron-500/20 to-teal-500/20 text-saffron-600 border border-saffron-500/30 flex items-center justify-center shrink-0 animate-pulse">
                      <Video size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Analyzing Travel Video with Multimodal AI</span>
                        <Loader2 size={13} className="animate-spin text-saffron-500" />
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm sm:max-w-md">
                        {pastedUrl}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Cancel processing"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-saffron-600 dark:text-saffron-400 flex items-center gap-1.5">
                      <Sparkles size={12} className="animate-spin text-saffron-500" />
                      {currentStageMessage || "Extracting landmarks & scheduling..."}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {currentProgressPercent}%
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-saffron-500 via-teal-500 to-teal-600 transition-all duration-500 rounded-full"
                      style={{ width: `${currentProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Pipeline Checklist Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {PIPELINE_STAGES.slice(0, 4).map((st) => {
                    const isDone = completedStages.includes(st.key);
                    const isCurrent = jobStatus === st.key;
                    return (
                      <div
                        key={st.key}
                        className={`flex items-center gap-1.5 p-2 rounded-md text-[11px] font-medium border ${
                          isDone
                            ? "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/40 dark:border-teal-900 dark:text-teal-300"
                            : isCurrent
                            ? "bg-saffron-50 border-saffron-300 text-saffron-700 dark:bg-saffron-950/40 dark:border-saffron-900 dark:text-saffron-300 animate-pulse"
                            : "bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-950/40 dark:border-slate-800"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 size={12} className="text-teal-600 shrink-0" />
                        ) : isCurrent ? (
                          <Loader2 size={12} className="animate-spin text-saffron-500 shrink-0" />
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

      {/* 2. HOW GHOOMO WORKS (4 STEPS) */}
      <section className="px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              The Core Problem & Solution
            </span>
            <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 dark:text-white font-heading">
              From Scattered Saved Links to a Master Trip Plan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              {
                step: "01",
                title: "Add from Reel, Short, or blog",
                desc: "Drop in any TikTok, Instagram Reel, YouTube short, or travel blog. No manual typing needed.",
                icon: LinkIcon,
                color: "text-orange-500 bg-orange-50 dark:bg-slate-800",
              },
              {
                step: "02",
                title: "Extract Locations",
                desc: "Verified coordinates with Indian reference datasets and how sure we are match scores.",
                icon: MapPin,
                color: "text-teal-600 bg-teal-50 dark:bg-slate-800",
              },
              {
                step: "03",
                title: "Smart trip plan",
                desc: "Best route for your trip grouped into days without zigzagging across India traffic.",
                icon: Compass,
                color: "text-emerald-600 bg-emerald-50 dark:bg-slate-800",
              },
              {
                step: "04",
                title: "Plan with friends",
                desc: "Invite friends via shareable link to vote on stops, split estimated budget, and check packing lists.",
                icon: Users,
                color: "text-cyan-600 bg-cyan-50 dark:bg-slate-800",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.step}
                  className="card-micro rounded-lg border border-slate-200 bg-white p-6 space-y-3 relative hover:border-teal-600/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 dark:border-slate-800 dark:bg-slate-900/50 shadow-xs"
                >
                  <span className="text-xs font-mono font-bold text-slate-400 block">
                    {card.step}
                  </span>
                  <div
                    className={`h-10 w-10 rounded-md flex items-center justify-center ${card.color}`}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. ZERO-MOCK REAL VOICE AI ARCHITECTURE */}
      <section className="px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                100% Real Speech Extraction
              </span>
              <h2 className="text-3xl font-normal text-slate-900 dark:text-white font-heading">
                Voice-Driven Travel Intelligence
              </h2>
            </div>
            <Link href="/trips" className="cursor-pointer">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 rounded-md active:scale-[0.98] cursor-pointer"
              >
                View All Workspaces <ArrowRight size={13} className="ml-1" />
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
                  className="card-micro group rounded-lg border border-slate-200 bg-white p-5 space-y-3 hover:border-teal-600/50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 shadow-xs flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-9 w-9 rounded-md bg-teal-50 dark:bg-slate-800 text-teal-600 flex items-center justify-center">
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                        {feature.badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
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

      {/* 4. CALL TO ACTION */}
      <section className="px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl rounded-lg border border-teal-900/20 bg-linear-to-br from-teal-900 via-teal-950 to-slate-950 p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-xl text-white">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-normal text-white font-heading">
              Ready to Turn Social Links into a Trip?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Create your first trip in 30 seconds. Plan with friends, track
              expenses, and view everything on an interactive map.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/trips/new" className="cursor-pointer w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-3 rounded-md cursor-pointer shadow-xs active:scale-[0.98] transition-all duration-100">
                Create Free Trip
              </Button>
            </Link>
            <Link href="/auth" className="cursor-pointer w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-white/30 bg-white/10 text-white hover:bg-white/20 text-sm px-6 py-3 rounded-md cursor-pointer active:scale-[0.98] transition-all duration-100"
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
