"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="flex flex-col gap-24 pb-12 overflow-hidden relative min-h-screen bg-[#fafbfc] dark:bg-[#070a10] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* 🌄 Scenic Panoramic Travel Landscape & Wanderlust Atmosphere Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {/* Cinematic Travel Panorama Image with Slow Ken-Burns Wanderlust Drift */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=80"
            alt="Scenic Travel Mountains Horizon"
            className="w-full h-full object-cover object-center animate-ken-burns opacity-[0.14] dark:opacity-[0.11] filter saturate-[1.25] contrast-[1.05]"
          />
          {/* Elegant atmospheric gradient veil keeping all text 100% crisp & readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#fafbfc]/80 via-[#fafbfc]/90 to-[#fafbfc] dark:from-[#070a10]/80 dark:via-[#070a10]/92 dark:to-[#070a10]" />
        </div>

        {/* Wanderlust Golden Hour & Sunset Atmosphere (Clean radial gradients with zero CSS blur filter to ensure 100% crisp font rendering) */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[850px] h-[520px] rounded-full pointer-events-none opacity-40 dark:opacity-25"
          style={{
            background: "radial-gradient(ellipse at center, rgba(249,115,22,0.20) 0%, rgba(251,191,36,0.10) 45%, transparent 70%)"
          }}
        />
        <div
          className="absolute top-1/4 -right-20 w-[650px] h-[520px] rounded-full pointer-events-none opacity-35 dark:opacity-20"
          style={{
            background: "radial-gradient(ellipse at center, rgba(244,63,94,0.16) 0%, rgba(249,115,22,0.08) 45%, transparent 70%)"
          }}
        />
        <div
          className="absolute top-1/3 -left-24 w-[650px] h-[550px] rounded-full pointer-events-none opacity-35 dark:opacity-20"
          style={{
            background: "radial-gradient(ellipse at center, rgba(245,158,11,0.16) 0%, rgba(249,115,22,0.08) 45%, transparent 70%)"
          }}
        />

        {/* Organic Topographic Map Elevation Contours (Hiking & Expedition Trail Lines) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.18] dark:opacity-[0.14] stroke-orange-600/30 dark:stroke-orange-400/20 animate-topo-wave pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          fill="none"
          preserveAspectRatio="none"
        >
          <path d="M-100,160 C300,300 600,-40 1000,180 C1250,300 1400,120 1600,200" strokeWidth="1.2" strokeDasharray="6 8" />
          <path d="M-100,280 C200,420 500,140 900,310 C1200,430 1350,260 1600,330" strokeWidth="1" />
          <path d="M-100,420 C350,560 650,290 1050,450 C1300,550 1450,410 1600,480" strokeWidth="1.5" strokeDasharray="4 6" />
          <path d="M-100,560 C250,710 580,480 980,620 C1250,720 1420,580 1600,640" strokeWidth="1" />
          <path d="M-100,720 C380,840 720,630 1100,760 C1320,830 1480,720 1600,770" strokeWidth="1.2" strokeDasharray="8 10" />
        </svg>

        {/* Floating Travel Destination Beacon Tags (Visible on Desktop) */}
        <div className="absolute top-28 left-[4%] hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-orange-200/80 dark:border-slate-800 shadow-md text-xs font-medium text-slate-800 dark:text-slate-200 animate-float-slow">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>📍 Pangong Tso, Ladakh</span>
          <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-1.5 py-0.5 rounded font-bold">4,250m</span>
        </div>

        <div className="absolute top-36 right-[5%] hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-orange-200/80 dark:border-slate-800 shadow-md text-xs font-medium text-slate-800 dark:text-slate-200 animate-float-slow-reverse">
          <span className="text-amber-500">🏰</span>
          <span>Amber Palace, Jaipur</span>
          <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded font-bold">Day 1</span>
        </div>

        <div className="absolute top-[480px] left-[3%] hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs text-[11px] text-slate-700 dark:text-slate-300 animate-float-slow">
          <span>🌴 Palolem Sunset, Goa</span>
          <span className="text-orange-500 text-[10px] font-bold">★ 4.9</span>
        </div>

        <div className="absolute top-[520px] right-[4%] hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs text-[11px] text-slate-700 dark:text-slate-300 animate-float-slow-reverse">
          <span>🛶 Shikara Row, Dal Lake</span>
          <span className="text-teal-600 dark:text-teal-400 text-[10px] font-bold">Verified</span>
        </div>
      </div>

      {/* 1. HERO & DIRECT SOCIAL URL EXTRACTOR */}
      <section className="relative pt-12 sm:pt-24 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl space-y-9 relative z-10 text-center">
          {/* Animated Sparkle Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-50/80 px-4 py-1.5 text-xs font-semibold text-orange-800 dark:border-orange-500/30 dark:bg-orange-950/30 dark:text-orange-300 shadow-xs backdrop-blur-md hover:border-orange-300 transition-all duration-300 cursor-default"
          >
            <Sparkles size={14} className="text-orange-600 dark:text-orange-400" />
            <span className="tracking-wide">AI-Powered Social Travel Intelligence</span>
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping" />
          </motion.div>

          {/* High-Contrast Headline with Animated Changing Gradient Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[1.05]">
              <span className="block font-heading font-bold text-slate-900 dark:text-white drop-shadow-xs">
                Stop Saving Reels.
              </span>
              <span className="block font-heading italic font-bold animate-gradient-text bg-gradient-to-r from-orange-600 via-rose-500 via-amber-500 to-orange-600 bg-clip-text text-transparent drop-shadow-xs mt-1">
                Start Traveling India & Beyond.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              Paste any Instagram Reel, TikTok, YouTube Short, or travel blog link.
              Ghoomo extracts verified places, pins them on interactive maps,
              and auto-clusters smart day-wise itineraries in seconds.
            </p>
          </motion.div>

          {/* DIRECT INLINE SOCIAL URL EXTRACTOR CARD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-3xl mx-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 sm:p-6 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl text-left transition-all duration-300 hover:border-orange-500/30 hover:shadow-[0_25px_60px_-15px_rgba(249,115,22,0.12)]"
          >
            {!isLoading && candidateDestinations.length === 0 ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1 group">
                    <LinkIcon
                      size={18}
                      className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-orange-500 transition-colors"
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
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 dark:bg-slate-950/80 dark:border-slate-800 dark:text-white transition-all shadow-xs"
                    />
                  </div>

                  <Button
                    onClick={() => handleStartDirectExtraction()}
                    disabled={!pastedUrl.trim()}
                    className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm px-6 py-3 rounded-xl enabled:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shrink-0 group"
                  >
                    <span>Smart Trip Plan</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300 text-xs"
                  >
                    <AlertCircle size={16} className="shrink-0 text-rose-500" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-orange-500 shrink-0" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">Multimodal AI: Speech, OCR, Visuals & Landmarks</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <Zap size={12} className="text-orange-500" /> Fast Execution
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <ShieldCheck size={12} className="text-emerald-500" /> 100% Verified
                    </span>
                  </div>
                </div>

                {/* SAMPLE REELS QUICK DEMO SELECTOR */}
                <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Play size={12} className="text-orange-500 fill-orange-500" />
                      Try with a sample social reel:
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">1-click test</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {SAMPLE_REELS_CATALOG.slice(0, 5).map((reel) => (
                      <motion.button
                        key={reel.id}
                        type="button"
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStartDirectExtraction(reel.url)}
                        className="group flex flex-col justify-between p-2 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-orange-50/60 hover:border-orange-300 dark:bg-slate-950/60 dark:border-slate-800 dark:hover:bg-slate-800/80 text-left transition-all duration-150 cursor-pointer shadow-2xs"
                      >
                        <div className="relative h-14 w-full rounded-lg overflow-hidden mb-1.5 bg-slate-200 dark:bg-slate-800">
                          <img
                            src={reel.thumbnailUrl}
                            alt={reel.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                              <Play size={11} className="fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                            {reel.title.split(" ")[0]} {reel.title.split(" ")[1]}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block truncate">
                            {reel.category}
                          </span>
                        </div>
                      </motion.button>
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
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                    Which destination would you like to build an itinerary for?
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    This video recommends multiple locations. Select your target region to generate a day-wise itinerary:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {candidateDestinations.map((cand) => (
                    <motion.button
                      key={cand.name}
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleConfirmDestination(cand.name)}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-orange-500/50 bg-slate-50/70 hover:bg-orange-50/60 dark:bg-slate-950 dark:border-slate-800 dark:hover:border-orange-500/50 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          <MapPin size={18} />
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {cand.name}
                          </span>
                          {cand.country && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{cand.country}</p>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-orange-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                    </motion.button>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 font-medium px-3.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/30 flex items-center justify-center shrink-0 animate-pulse shadow-xs">
                      <Video size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Analyzing Travel Video with Multimodal AI</span>
                        <Loader2 size={14} className="animate-spin text-orange-600" />
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
                    <span className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                      <Sparkles size={13} className="animate-spin text-orange-600" />
                      {currentStageMessage || "Extracting landmarks & scheduling..."}
                    </span>
                    <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                      {currentProgressPercent}%
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 transition-all duration-500 rounded-full shadow-xs"
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
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                            : isCurrent
                            ? "bg-orange-50 border-orange-300 text-orange-900 dark:bg-orange-950/50 dark:border-orange-700 dark:text-orange-200 animate-pulse shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-950/40 dark:border-slate-800"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        ) : isCurrent ? (
                          <Loader2 size={13} className="animate-spin text-orange-600 shrink-0" />
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
          </motion.div>
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
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 sm:p-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70 shadow-xs hover:shadow-lg hover:border-orange-500/30 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {stat.value}
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                    {stat.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {stat.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. HOW GHOOMO WORKS (4 STEPS) */}
      <section className="px-4 sm:px-6 relative z-10">
        <div className="container mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 px-3.5 py-1.5 rounded-full border border-orange-200/80 dark:border-orange-800/80">
              The Core Problem & Solution
            </span>
            <h2 className="text-3xl sm:text-5xl font-normal text-slate-900 dark:text-white font-heading">
              From Scattered Saved Links to a Master Day-Wise Plan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
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
              },
              {
                step: "02",
                title: "Extract Verified Places",
                desc: "Multimodal AI extracts coordinates, audio transcript mentions, and landmark visual evidence.",
                icon: MapPin,
              },
              {
                step: "03",
                title: "Geo-Clustered Schedule",
                desc: "Nearest-neighbor engine clusters stops into optimized daily routes to save travel time.",
                icon: Compass,
              },
              {
                step: "04",
                title: "Plan & Split with Friends",
                desc: "Invite trip members via shareable link to vote on places, track expenses, and check packing lists.",
                icon: Users,
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  whileHover={{ y: -5 }}
                  className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 space-y-4 relative hover:shadow-xl hover:border-orange-500/40 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/70 backdrop-blur-md shadow-xs flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 rounded-md border border-orange-200/70 dark:border-orange-900">
                        STEP {card.step}
                      </span>
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center border border-slate-200/80 dark:border-slate-800 bg-slate-50 text-orange-600 dark:bg-slate-950 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-200">
                        <Icon size={18} />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. REAL VOICE AI & MULTIMODAL ARCHITECTURE */}
      <section className="px-4 sm:px-6 relative z-10">
        <div className="container mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="space-y-2">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
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
                className="text-xs text-slate-700 hover:text-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer active:scale-95 transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
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
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="group rounded-2xl border border-slate-200/80 bg-white/90 p-5 space-y-4 hover:shadow-lg hover:border-orange-500/30 transition-all duration-300 shadow-xs flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900/70 backdrop-blur-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors duration-200">
                        <Icon size={19} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {feature.badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-5xl mx-auto rounded-3xl border border-orange-200/90 dark:border-slate-800/90 bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-white dark:from-slate-950 dark:via-slate-900 dark:to-[#0c121e] px-6 py-14 sm:px-12 sm:py-20 text-center space-y-8 relative overflow-hidden shadow-[0_20px_50px_-10px_rgba(249,115,22,0.10)] dark:shadow-2xl transition-colors duration-300"
        >
          {/* Subtle Ambient Glow Circles with clean radial gradients */}
          <div
            className="absolute -top-24 -left-24 w-80 h-80 rounded-full pointer-events-none opacity-40 dark:opacity-20"
            style={{ background: "radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full pointer-events-none opacity-40 dark:opacity-20"
            style={{ background: "radial-gradient(circle, rgba(245,158,11,0.20) 0%, transparent 70%)" }}
          />

          {/* Badge cleanly inside card */}
          <div className="relative z-10 flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-100/90 text-orange-800 border border-orange-200 text-xs font-semibold backdrop-blur-md dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30 shadow-2xs">
              <Sparkles size={13} className="text-orange-600 dark:text-orange-400" /> Ready in 30 Seconds
            </span>
          </div>

          {/* Headline & Description */}
          <div className="space-y-3 max-w-2xl mx-auto relative z-10">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-normal text-slate-900 dark:text-white font-heading leading-tight">
              Ready to Turn Social Links into Real Trips?
            </h2>
            <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
              Create your first trip workspace in seconds. Plan with friends, track shared budget expenses, and explore interactive maps.
            </p>
          </div>

          {/* Action Buttons cleanly inside card with generous padding */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 relative z-10 mx-auto w-full pt-3">
            <Link href="/trips/new" className="cursor-pointer w-full sm:w-auto shrink-0">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-sm px-7 py-3.5 rounded-xl cursor-pointer shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                <span>Create Free Trip</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/auth" className="cursor-pointer w-full sm:w-auto shrink-0">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-xs hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-800 text-sm px-6 py-3.5 rounded-xl cursor-pointer active:scale-[0.98] transition-all duration-200 backdrop-blur-md"
              >
                Switch Demo Persona
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

