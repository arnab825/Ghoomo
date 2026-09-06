"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { tripService } from "@/lib/services/tripService";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const [pastedUrl, setPastedUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const handleQuickExtract = async (urlToUse?: string) => {
    let url = (urlToUse || pastedUrl).trim();
    if (!url) {
      router.push("/trips/new");
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    setIsProcessing(true);
    setExtractError(null);
    try {
      const newTrip = await tripService.createTrip({
        title: "",
        destinationRegion: "",
        durationDays: 3,
        budgetTotal: 15000,
        travelStyle: "friends",
        initialSocialUrl: url,
      });

      router.push(`/trips/${newTrip.id}`);
    } catch (err) {
      console.error(err);
      setExtractError(
        err instanceof Error ? err.message : "Location cannot be detected from this video transcript."
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-16 pb-20 overflow-hidden">
      {/* 1. HERO & SOCIAL URL EXTRACTOR */}
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

          {/* Core Feature: Interactive Social URL Input Box */}
          <div className="max-w-2xl mx-auto rounded-lg border border-slate-200 bg-white p-2 sm:p-2.5 shadow-md dark:border-slate-800 dark:bg-slate-900/90 ring-1 ring-slate-950/5">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <LinkIcon
                  size={18}
                  className="absolute left-3.5 top-3.5 text-slate-400"
                />
                <input
                  type="url"
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  placeholder="Paste Instagram Reel, TikTok, YouTube Short, or blog..."
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                />
              </div>

              <Button
                onClick={() => handleQuickExtract()}
                disabled={isProcessing}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-3 rounded-md cursor-pointer shadow-xs flex items-center justify-center gap-2 transition-all duration-100 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <span>Extracting Places...</span>
                ) : (
                  <>
                    <span>Smart trip plan</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>

            {extractError && (
              <div className="mt-2 text-left text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-md p-2">
                {extractError}
              </div>
            )}

            {/* Real-time Voice Detection Guarantee */}
            <div className="pt-2 px-1 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Sparkles size={12} className="text-teal-600 shrink-0" />
              <span>Paste any travel video with voice speech — AI verifies real locations, sets budget, and builds your checklist.</span>
            </div>
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
