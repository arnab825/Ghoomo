"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import InteractiveMap from "@/components/map/InteractiveMap";
import UrlImportModal from "@/components/social-import/UrlImportModal";
import AddPlaceModal from "@/components/places/AddPlaceModal";
import CollaborationModal from "@/components/collaboration/CollaborationModal";
import BudgetAndChecklist from "@/components/budget-checklist/BudgetAndChecklist";
import LivePollWidget from "@/components/collaboration/LivePollWidget";
import TripChat from "@/components/chat/TripChat";
import { Button } from "@/components/ui/button";
import {
  Compass,
  MapPin,
  Calendar,
  Users,
  Link as LinkIcon,
  Plus,
  Share2,
  Trash2,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Clock,
  Vote,
  Shuffle,
  ChevronRight,
  Layers,
  DollarSign,
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  Zap,
  RefreshCw,
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Place,
  TimeSlot,
  GhoomoTrip,
  ItineraryDay,
  ItineraryItem,
  TripSource,
  Collaborator,
  AITier,
  ValidationSummary,
} from "@/lib/types/ghoomo";
import ProgressiveLoading from "@/components/shared/ProgressiveLoading";
import { useQueryClient } from "@tanstack/react-query";
import {
  useTrip,
  useAutoGenerateItineraryMutation,
  useDeletePlaceMutation,
  useUpdatePlaceConfidenceMutation,
  useMovePlaceToDayMutation,
  useDeleteTripMutation,
  TRIP_KEYS,
} from "@/hooks/useTripQueries";
import { useUIStore } from "@/stores/useUIStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { TripWorkspaceSkeleton } from "@/components/shared/skeletons/TripWorkspaceSkeleton";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const DAY_COLOR_CLASSES: Record<
  number,
  { text: string; bg: string; border: string }
> = {
  1: {
    text: "text-teal-700 dark:text-teal-300",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-800",
  },
  2: {
    text: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-800",
  },
  3: {
    text: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
  },
  4: {
    text: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
  },
  5: {
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  6: {
    text: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
  },
  7: {
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
};

function getDayColorClasses(dayNumber: number) {
  const keys = Object.keys(DAY_COLOR_CLASSES).map(Number);
  const key = ((dayNumber - 1) % keys.length) + 1;
  return DAY_COLOR_CLASSES[key] || DAY_COLOR_CLASSES[1];
}

export default function TripWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;
  const queryClient = useQueryClient();

  // 1. TanStack Query Server State (with Caching & Auto-Refetch)
  const { data: trip, isLoading, isError, error, refetch } = useTrip(tripId);

  // Mutations
  const autoGroupMutation = useAutoGenerateItineraryMutation(tripId);
  const deletePlaceMutation = useDeletePlaceMutation(tripId);
  const updateConfidenceMutation = useUpdatePlaceConfidenceMutation(tripId);
  const movePlaceMutation = useMovePlaceToDayMutation(tripId);
  const deleteTripMutation = useDeleteTripMutation();

  // 2. Zustand Store strictly for Local UI State
  const {
    isImportModalOpen,
    setImportModalOpen,
    isAddPlaceModalOpen,
    setAddPlaceModalOpen,
    isCollabModalOpen,
    setCollabModalOpen,
    activeTab,
    setActiveTab,
    selectedDayFilter,
    setSelectedDayFilter,
    selectedPlaceId,
    setSelectedPlaceId,
  } = useUIStore();

  const [aiTierUsed, setAiTierUsed] = useState<AITier | null>(null);
  const [validationSummary, setValidationSummary] =
    useState<ValidationSummary | null>(null);
  const { currentUser, deductCredits } = useAuthStore();
  const [creditAlert, setCreditAlert] = useState<string | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});
  const [copiedSourceId, setCopiedSourceId] = useState<string | null>(null);

  // Loading Skeleton State
  if (isLoading) {
    return <TripWorkspaceSkeleton />;
  }

  // Error State with Retry
  if (isError || !trip) {
    return (
      <div className="container mx-auto max-w-md py-20 text-center space-y-4">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-rose-950/50">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
          {isError ? "Unable to Load Trip" : "Trip Not Found"}
        </h2>
        <p className="text-xs text-slate-500">
          {error instanceof Error
            ? error.message
            : "This trip workspace does not exist or has been removed from the server."}
        </p>
        <div className="flex items-center justify-center gap-2.5 pt-2">
          <Button
            onClick={() => refetch()}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-4 py-2 rounded-md shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw size={13} className="mr-1.5" />
            <span>Try Again</span>
          </Button>
          <Link href="/trips">
            <Button
              variant="outline"
              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 text-xs px-4 py-2 rounded-md shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <ArrowLeft size={13} className="mr-1.5" />
              <span>Return to Trips</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleCopyTranscript = (sourceId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSourceId(sourceId);
    setTimeout(() => setCopiedSourceId(null), 2000);
  };

  const handleSelectPlace = (placeId: string) => {
    setSelectedPlaceId(placeId);
  };

  const handleDeleteTrip = async () => {
    if (confirm("Are you sure you want to permanently delete this trip?")) {
      await deleteTripMutation.mutateAsync(tripId);
      router.push("/trips");
    }
  };

  const handleAutoGroupWithAI = async () => {
    if (!trip) return;
    if ((currentUser.credits ?? 9) < 3) {
      setCreditAlert(
        "You have fewer than 3 credits remaining. Please upgrade or top up credits to generate a full smart itinerary.",
      );
      return;
    }

    try {
      setCreditAlert(null);
      const res = await autoGroupMutation.mutateAsync({
        destination: trip.destinationRegion,
        durationDays: trip.durationDays,
        places: trip.places,
      });

      // Deduct 3 credits locally in store
      deductCredits(3);

      setAiTierUsed(res.tierUsed);
      setValidationSummary(res.validation);
    } catch (err: any) {
      console.error("[AI Fallback] Action error:", err);
      setCreditAlert(err.message || "AI generation failed.");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-72px)] bg-[#fafafa] dark:bg-[#0a0e17] text-slate-900 dark:text-slate-100">
      {/* 1. TOP CONTROL BAR */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 py-3 sticky top-16 z-30 dark:border-slate-800 dark:bg-slate-950/80 shadow-xs">
        <div className="container mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Back + Title + Meta */}
          <div className="flex items-center gap-3">
            <Link
              href="/trips"
              className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-heading truncate max-w-md">
                  {trip.title}
                </h1>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-teal-600/10 text-teal-700 border border-teal-600/20 dark:bg-teal-950/50 dark:text-teal-300">
                  {trip.travelStyle}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 text-teal-700 dark:text-teal-400 font-medium">
                  <MapPin size={12} /> {trip.destinationRegion}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {trip.durationDays} Days (
                  {trip.places.length} places)
                </span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold font-mono">
                  Budget ₹{trip.budgetTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions Cluster */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Collaborators Stack */}
            <button
              onClick={() => setCollabModalOpen(true)}
              title="Plan with friends"
              className="flex items-center gap-2 p-1.5 pr-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/70 transition-all duration-100 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex -space-x-2">
                {trip.collaborators
                  .slice(0, 3)
                  .map((c: Collaborator, i: number) => (
                    <div
                      key={c.id}
                      className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-700 overflow-hidden"
                    >
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        c.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  ))}
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {trip.collaborators.length}{" "}
                {trip.collaborators.length === 1 ? "member" : "members"}
              </span>
            </button>

            {/* Import Social Reel CTA */}
            <Button
              onClick={() => setImportModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs py-2 px-3.5 rounded-md cursor-pointer shadow-xs active:scale-[0.98] transition-all duration-100"
            >
              <LinkIcon size={14} className="mr-1.5" />
              <span>Add from Reel, Short, or blog</span>
            </Button>

            {/* Add Manual Place */}
            <Button
              onClick={() => setAddPlaceModalOpen(true)}
              variant="outline"
              size="sm"
              className="bg-white border border-teal-600 text-teal-600 hover:bg-teal-50 text-xs px-3 py-2 rounded-md cursor-pointer shadow-xs active:scale-[0.98] transition-all duration-100 dark:bg-slate-900 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-slate-800"
            >
              <Plus size={14} className="mr-1 text-teal-600" />
              <span>Add Place</span>
            </Button>

            {/* Auto-Cluster Itinerary via 3-Tier AI Fallback */}
            <Button
              onClick={handleAutoGroupWithAI}
              disabled={autoGroupMutation.isPending}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs px-3 py-2 rounded-md cursor-pointer shadow-xs active:scale-[0.98] transition-all duration-100 flex items-center gap-1.5"
            >
              <Shuffle
                size={13}
                className={`text-white ${autoGroupMutation.isPending ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">
                {autoGroupMutation.isPending
                  ? "Building route..."
                  : "Best route for your trip"}
              </span>
              <span className="text-[10px] font-mono bg-teal-800/60 px-1.5 py-0.2 rounded-xs">
                3 credits
              </span>
            </Button>

            {/* Share / Collab Modal */}
            <Button
              onClick={() => setCollabModalOpen(true)}
              variant="ghost"
              size="sm"
              title="Plan with friends"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer px-2 rounded-md active:scale-[0.98]"
            >
              <Share2 size={16} />
            </Button>

            {/* Delete Trip */}
            <Button
              onClick={handleDeleteTrip}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-red-600 cursor-pointer px-2 rounded-md active:scale-[0.98]"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {/* Credit Alert Banner */}
        {creditAlert && (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 flex items-center justify-between dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <span>{creditAlert}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/pricing">
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold h-7 px-2.5 rounded-md cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  Get Credits
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => setCreditAlert(null)}
                className="text-amber-700 hover:text-amber-950 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. MAIN WORKSPACE (SPLIT VIEW: CONTROLS + MAP-FIRST) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT COLUMN: ITINERARY, PLACES & BUDGET (5 COLUMNS) */}
        <div className="lg:col-span-5 border-r border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-950/50 p-4 sm:p-5 overflow-y-auto max-h-[calc(100vh-130px)] space-y-4">
          {/* Tabs Navigation */}
          <div className="flex p-1 rounded-md bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab("itinerary")}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-md text-xs font-semibold transition-all duration-100 cursor-pointer active:scale-[0.98] ${
                activeTab === "itinerary"
                  ? "bg-white text-saffron-600 shadow-xs dark:bg-saffron-600 dark:text-white font-bold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Plan
            </button>
            <button
              onClick={() => setActiveTab("places")}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-md text-xs font-semibold transition-all duration-100 cursor-pointer active:scale-[0.98] ${
                activeTab === "places"
                  ? "bg-white text-saffron-600 shadow-xs dark:bg-saffron-600 dark:text-white font-bold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Places ({trip.places.length})
            </button>
            <button
              onClick={() => setActiveTab("budget")}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-md text-xs font-semibold transition-all duration-100 cursor-pointer active:scale-[0.98] ${
                activeTab === "budget"
                  ? "bg-white text-saffron-600 shadow-xs dark:bg-saffron-600 dark:text-white font-bold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Budget
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-md text-xs font-semibold transition-all duration-100 cursor-pointer active:scale-[0.98] ${
                activeTab === "chat"
                  ? "bg-white text-saffron-600 shadow-xs dark:bg-saffron-600 dark:text-white font-bold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Chat & AI
            </button>
            <button
              onClick={() => setActiveTab("polls")}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-md text-xs font-semibold transition-all duration-100 cursor-pointer active:scale-[0.98] ${
                activeTab === "polls"
                  ? "bg-white text-saffron-600 shadow-xs dark:bg-saffron-600 dark:text-white font-bold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Polls
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-md text-xs font-semibold transition-all duration-100 cursor-pointer active:scale-[0.98] ${
                activeTab === "friends"
                  ? "bg-white text-saffron-600 shadow-xs dark:bg-saffron-600 dark:text-white font-bold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Friends
            </button>
          </div>

          {/* TAB 1: DAILY ITINERARY */}
          {activeTab === "itinerary" && (
            <div className="tab-fade-enter space-y-4">
              {/* Progressive Loading State during AI generation */}
              <ProgressiveLoading
                isLoading={autoGroupMutation.isPending}
                tierHint={aiTierUsed || undefined}
              />

              {/* AI Tier & Validation Alert Banner */}
              {aiTierUsed && !autoGroupMutation.isPending && (
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2.5 dark:border-slate-800 dark:bg-slate-900/60 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                      <Zap size={13} className="text-teal-600" />
                      <span>Best route for your trip:</span>
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300">
                        {aiTierUsed === "tier1_gemini"
                          ? "Tier 1: Gemini 1.5 Flash"
                          : aiTierUsed === "tier2_groq"
                            ? "Tier 2: Groq Llama 3.1 70B"
                            : "Tier 3: Rule Clustering"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {validationSummary?.flaggedForReview ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                          <AlertTriangle size={11} className="text-amber-600" />
                          <span>Needs Review</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                          <CheckCircle2
                            size={11}
                            className="text-emerald-600"
                          />
                          <span>Pace Validated</span>
                        </span>
                      )}

                      {validationSummary && (
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          ~{validationSummary.totalDistanceKm} km
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Travel Alerts (>2h consecutive transit) */}
                  {validationSummary &&
                    validationSummary.consecutiveTravelAlerts &&
                    validationSummary.consecutiveTravelAlerts.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                          <Clock size={12} className="text-amber-600" />
                          <span>Transit Time Exceeds Ideal 2 Hours:</span>
                        </div>
                        {validationSummary.consecutiveTravelAlerts.map(
                          (alert: string, i: number) => (
                            <div
                              key={i}
                              className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 pl-3 border-l-2 border-amber-400"
                            >
                              <span>{alert}</span>
                            </div>
                          ),
                        )}
                      </div>
                    )}

                  {/* Warnings (e.g. >8 places capped or high pace) */}
                  {validationSummary &&
                    validationSummary.warnings &&
                    validationSummary.warnings.length > 0 && (
                      <div className="space-y-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                        {validationSummary.warnings.map((warn: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300"
                          >
                            <AlertTriangle
                              size={12}
                              className="shrink-0 mt-0.5 text-amber-500"
                            />
                            <span>{warn}</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}

              {/* Day Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedDayFilter(null)}
                  className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-all duration-100 cursor-pointer active:scale-[0.98] ${
                    selectedDayFilter === null
                      ? "bg-slate-900 text-white font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400"
                  }`}
                >
                  All Days
                </button>
                {trip.days.map((day: ItineraryDay) => {
                  const style = DAY_COLOR_CLASSES[day.dayNumber] || {
                    text: "text-teal-700",
                    bg: "bg-teal-50",
                    border: "border-teal-200",
                  };
                  const isSelected = selectedDayFilter === day.dayNumber;
                  return (
                    <button
                      key={day.id}
                      onClick={() =>
                        setSelectedDayFilter(isSelected ? null : day.dayNumber)
                      }
                      className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-all duration-100 cursor-pointer border active:scale-[0.98] ${
                        isSelected
                          ? `${style.bg} ${style.text} ${style.border} font-bold shadow-xs`
                          : "text-slate-600 hover:text-slate-900 bg-white border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400"
                      }`}
                    >
                      Day {day.dayNumber} ({day.items.length})
                    </button>
                  );
                })}
              </div>

              {/* Day Cards List */}
              <div className="space-y-4">
                {trip.days
                  .filter(
                    (day: ItineraryDay) =>
                      selectedDayFilter === null ||
                      day.dayNumber === selectedDayFilter,
                  )
                  .map((day: ItineraryDay) => {
                    const style = getDayColorClasses(day.dayNumber);
                    const isDayFocused = selectedDayFilter === day.dayNumber;

                    return (
                      <div
                        key={day.id}
                        className={`card-micro rounded-lg border p-4 space-y-3 shadow-xs transition-all duration-200 dark:bg-slate-900/60 ${
                          isDayFocused
                            ? "border-teal-600/80 bg-teal-50/20 ring-1 ring-teal-500/20 dark:border-teal-800"
                            : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800"
                        }`}
                      >
                        {/* Day Header with Direct Map Focus */}
                        <div
                          onClick={() =>
                            setSelectedDayFilter(isDayFocused ? null : day.dayNumber)
                          }
                          className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold ${style.bg} ${style.text} border ${style.border}`}
                            >
                              D{day.dayNumber}
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                                {day.theme}
                              </h3>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {day.items.length === 0
                                  ? "No places scheduled yet"
                                  : `${day.items.length} locations • Clustered by proximity`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDayFilter(isDayFocused ? null : day.dayNumber);
                              }}
                              className={`text-[10px] px-2 py-1 rounded-md border flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                                isDayFocused
                                  ? "bg-teal-600 text-white border-teal-600"
                                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                              }`}
                              title="Focus this day on the map"
                            >
                              <Compass size={11} />
                              <span>{isDayFocused ? "Focused" : "Focus Map"}</span>
                            </button>

                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddPlaceModalOpen(true);
                              }}
                              size="sm"
                              variant="ghost"
                              className="text-[11px] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 rounded-md active:scale-[0.98]"
                            >
                              <Plus size={13} className="mr-0.5" /> Place
                            </Button>
                          </div>
                        </div>

                        {/* Items in this Day */}
                        {day.items.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400">
                            Click &quot;Best route for your trip&quot; or import
                            a reel to populate Day {day.dayNumber}.
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {day.items.map(
                              (item: ItineraryItem, idx: number) => {
                                const place =
                                  item.place ||
                                  trip.places.find(
                                    (p: Place) => p.id === item.placeId,
                                  );
                                if (!place) return null;
                                const isSelected = selectedPlaceId === place.id;

                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => handleSelectPlace(place.id)}
                                    className={`p-3 rounded-md border transition-all duration-100 cursor-pointer active:scale-[0.99] ${
                                      isSelected
                                        ? "border-teal-600 bg-teal-50/70 ring-1 ring-teal-600/30"
                                        : "border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60"
                                    }`}
                                  >
                                    <div className="flex gap-3">
                                      {place.imageUrl && (
                                        <img
                                          src={place.imageUrl}
                                          alt={place.name}
                                          className="h-16 w-16 rounded-md object-cover shrink-0"
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                          <div className="flex items-center gap-1.5 truncate">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                              {idx + 1}. {place.name}
                                            </span>
                                            {place.sourceType === 'creator' || place.provenance?.startsWith('creator_') || item.sourceType === 'creator' ? (
                                              <span className="text-[10px] font-semibold text-saffron-600 bg-saffron-50 dark:bg-saffron-950/60 px-1.5 py-0.2 rounded border border-saffron-200 dark:border-saffron-800 shrink-0">
                                                🎬 Creator
                                              </span>
                                            ) : (
                                              <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 dark:bg-violet-950/60 px-1.5 py-0.2 rounded border border-violet-200 dark:border-violet-800 shrink-0">
                                                ✨ AI Added
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                                            {Math.round((place.confidence || 0.9) * 100)}%
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                          <span>{place.city}</span>
                                          <span>•</span>
                                          <span className="capitalize">{item.timeSlot}</span>
                                          <span>({item.durationMinutes}m)</span>
                                          {item.startTime && item.endTime && (
                                            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                              ⏰ {item.startTime}–{item.endTime}
                                            </span>
                                          )}
                                          {item.travelMinutesFromPrevious !== undefined && item.travelMinutesFromPrevious > 0 && (
                                            <span className="text-[10px] text-teal-700 dark:text-teal-400">
                                              🚗 {item.travelMinutesFromPrevious}m transit
                                            </span>
                                          )}
                                        </div>

                                        {item.mealSuggestion && (
                                          <div className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/30 px-2 py-0.5 rounded mt-1 border border-amber-200/50 dark:border-amber-900/40">
                                            🍽️ Recommendation: {item.mealSuggestion}
                                          </div>
                                        )}

                                        {place.notes && (
                                          <div className="text-[10px] text-slate-500 line-clamp-1 mt-1">
                                            {place.notes}
                                          </div>
                                        )}

                                        {/* Quick Move Day Dropdown */}
                                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/80 dark:border-slate-800/60 text-[10px]">
                                          <div className="flex items-center gap-1 text-slate-500">
                                            <span>Move:</span>
                                            {trip.days.map(
                                              (d: ItineraryDay) => (
                                                <button
                                                  key={d.dayNumber}
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    movePlaceMutation.mutate({
                                                      placeId: place.id,
                                                      dayNumber: d.dayNumber,
                                                      timeSlot: item.timeSlot,
                                                    });
                                                  }}
                                                  className={`px-1.5 py-0.5 rounded-md text-[10px] cursor-pointer active:scale-[0.98] transition-all duration-100 ${
                                                    d.dayNumber ===
                                                    day.dayNumber
                                                      ? "bg-teal-600 text-white font-bold"
                                                      : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-900 dark:text-slate-300"
                                                  }`}
                                                >
                                                  D{d.dayNumber}
                                                </button>
                                              ),
                                            )}
                                          </div>

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deletePlaceMutation.mutate(
                                                place.id,
                                              );
                                            }}
                                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer active:scale-[0.98] transition-all duration-100"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 2: PLACES & SOCIAL SOURCES RADAR */}
          {activeTab === "places" && (
            <div className="tab-fade-enter space-y-4">
              {/* Ingested Social Sources Showcase */}
              {trip.sources.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <LinkIcon size={12} className="text-teal-600" />
                    <span>
                      Add from Reel, Short, or blog ({trip.sources.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {trip.sources.map((src: TripSource) => {
                      const placesFromSource = trip.places.filter(
                        (p: Place) => p.sourceId === src.id,
                      );
                      const isSourceActive =
                        placesFromSource.length > 0 &&
                        placesFromSource.some((p) => p.id === selectedPlaceId);

                      const isExpanded = !!expandedTranscripts[src.id];
                      const transcript = src.rawTranscript || "";

                      return (
                        <div
                          key={src.id}
                          className={`card-micro p-3 rounded-lg border transition-all duration-200 space-y-2.5 ${
                            isSourceActive
                              ? "border-teal-600 bg-teal-50/70 ring-1 ring-teal-600/30 dark:bg-teal-950/40"
                              : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/80"
                          }`}
                        >
                          <div
                            onClick={() => {
                              if (placesFromSource.length > 0) {
                                setSelectedDayFilter(null);
                                handleSelectPlace(placesFromSource[0].id);
                              }
                            }}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <img
                              src={src.thumbnailUrl}
                              alt={src.title}
                              className="h-13 w-13 rounded-md object-cover shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {src.title}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                By {src.author} on{" "}
                                <span className="uppercase text-orange-600 font-medium">
                                  {src.platform}
                                </span>
                                {placesFromSource.length > 0 && (
                                  <span className="ml-2 text-teal-700 dark:text-teal-400 font-medium">
                                    • {placesFromSource.length} places (Click to zoom)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <a
                                  href={src.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center text-[10px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                                >
                                  <span>Open original link</span>
                                  <ExternalLink size={10} className="ml-1" />
                                </a>

                                {transcript && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedTranscripts((prev) => ({
                                        ...prev,
                                        [src.id]: !prev[src.id],
                                      }));
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300 hover:text-teal-600 font-medium cursor-pointer"
                                  >
                                    <FileText size={11} className="text-teal-600" />
                                    <span>
                                      {isExpanded
                                        ? "Hide Voice Transcript"
                                        : "View Full Extracted Voice Transcript"}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp size={11} />
                                    ) : (
                                      <ChevronDown size={11} />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Full Transcript Expandable Context Box */}
                          {isExpanded && transcript && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-2 animate-in fade-in duration-200">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                  <Sparkles size={11} className="text-teal-600" />
                                  Extracted Spoken Voice Audio Transcript & Captions
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400">
                                    {transcript.length} chars • {transcript.split(/\s+/).filter(Boolean).length} words
                                  </span>
                                  <button
                                    onClick={() => handleCopyTranscript(src.id, transcript)}
                                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-700 dark:text-slate-300 text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    {copiedSourceId === src.id ? (
                                      <>
                                        <CheckCircle2 size={11} className="text-emerald-600" />
                                        <span className="text-emerald-600 font-semibold">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={11} />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded border border-slate-200/80 dark:border-slate-800/80 max-h-48 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line select-text">
                                {transcript}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Places List with Confidence Sliders */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Detected Places & How sure we are</span>
                  <span className="text-[10px] text-slate-500">
                    Tap to zoom on map
                  </span>
                </div>

                <div className="space-y-2">
                  {trip.places.map((place: Place) => {
                    const isSelected = selectedPlaceId === place.id;
                    return (
                      <div
                        key={place.id}
                        onClick={() => handleSelectPlace(place.id)}
                        className={`card-micro p-3 rounded-md border text-xs space-y-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                          isSelected
                            ? "border-teal-600 bg-teal-50/70 ring-1 ring-teal-600/30"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                            <MapPin size={13} className="text-teal-600 shrink-0" />
                            <span className="truncate">{place.name}</span>
                            {place.sourceType === 'creator' || place.provenance?.startsWith('creator_') ? (
                              <span className="text-[10px] font-semibold text-saffron-600 bg-saffron-50 dark:bg-saffron-950/60 px-1.5 py-0.2 rounded border border-saffron-200 dark:border-saffron-800 shrink-0">
                                🎬 Creator
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 dark:bg-violet-950/60 px-1.5 py-0.2 rounded border border-violet-200 dark:border-violet-800 shrink-0">
                                ✨ AI Added
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                              place.confidence > 0.85
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {Math.round(place.confidence * 100)}%
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          {place.city}, {place.state} • {place.category}
                        </div>

                        {/* Confidence Adjustment Slider */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-slate-500 font-medium">
                            How sure we are:
                          </span>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={place.confidence}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateConfidenceMutation.mutate({
                                placeId: place.id,
                                confidence: parseFloat(e.target.value),
                              });
                            }}
                            className="slider-teal flex-1"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BUDGET & CHECKLIST */}
          {activeTab === "budget" && (
            <div className="tab-fade-enter">
              <BudgetAndChecklist
                tripId={tripId}
                budgetTotal={trip.budgetTotal}
                budgetItems={trip.budgetItems}
                checklistItems={trip.checklistItems}
              />
            </div>
          )}

          {/* TAB 4: LIVE POLLS */}
          {activeTab === "polls" && (
            <div className="tab-fade-enter">
              <LivePollWidget tripId={tripId} />
            </div>
          )}

          {/* TAB 5: CHAT & AI TRIP ASSISTANT */}
          {activeTab === "chat" && (
            <div className="tab-fade-enter">
              <TripChat
                trip={trip}
                onTripUpdated={(updated) => {
                  queryClient.setQueryData(TRIP_KEYS.detail(tripId), updated);
                  refetch();
                }}
              />
            </div>
          )}

          {/* TAB 6: FRIENDS & SHARE */}
          {activeTab === "friends" && (
            <div className="tab-fade-enter p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-saffron-500/10 text-saffron-600 flex items-center justify-center font-bold text-sm shrink-0">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white">Trip Collaborators & Invite</h3>
                    <p className="text-[10px] text-slate-500">Plan together in real-time with your travel squad</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setCollabModalOpen(true)}
                  className="bg-saffron-500 hover:bg-saffron-600 text-white text-xs h-7 px-2.5 rounded-md enabled:cursor-pointer disabled:cursor-not-allowed shadow-xs"
                >
                  <Share2 size={12} className="mr-1" />
                  <span>Invite</span>
                </Button>
              </div>

              {/* Instant Share Link */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Fast Invite Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/trips/${trip.id}` : ''}
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-xs font-mono select-all"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/trips/${trip.id}`);
                        setCreditAlert('Invite link copied to clipboard!');
                      }
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 px-3 rounded-md enabled:cursor-pointer disabled:cursor-not-allowed shrink-0"
                  >
                    Copy Link
                  </Button>
                </div>
                <p className="text-[10px] text-slate-500">Anyone with this link can view, vote on polls, and chat in this trip room.</p>
              </div>

              {/* Active Members */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Members (1)</div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-linear-to-br from-saffron-500 to-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {currentUser?.name?.[0] || 'Y'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{currentUser?.name || 'You'} (Trip Owner)</p>
                      <p className="text-[10px] text-slate-500">{currentUser?.email || 'traveler@ghoomo.in'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-saffron-600 bg-saffron-50 dark:bg-saffron-950/60 px-2 py-0.5 rounded border border-saffron-200 dark:border-saffron-800">
                    OWNER
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FLAGSHIP INTERACTIVE MAP (7 COLUMNS) */}
        <div className="lg:col-span-7 h-125 lg:h-full relative p-4 flex flex-col isolate z-0">
          <div className="flex-1 rounded-lg overflow-hidden shadow-xs border border-slate-200 bg-white relative isolate z-0 dark:border-slate-800 dark:bg-slate-950">
            <ErrorBoundary
              fallbackTitle="Map Rendering Glitch"
              fallbackMessage="We couldn't initialize the map view. Your places and itinerary schedule remain fully accessible."
            >
              <InteractiveMap
                places={trip.places}
                selectedPlaceId={selectedPlaceId}
                onSelectPlace={handleSelectPlace}
                highlightDay={selectedDayFilter}
                onSelectDay={setSelectedDayFilter}
                durationDays={trip.durationDays}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <UrlImportModal
        tripId={tripId}
        isOpen={isImportModalOpen}
        onClose={() => setImportModalOpen(false)}
      />

      <AddPlaceModal
        tripId={tripId}
        isOpen={isAddPlaceModalOpen}
        onClose={() => setAddPlaceModalOpen(false)}
        defaultCity={trip.destinationRegion}
      />

      <CollaborationModal
        tripId={tripId}
        isOpen={isCollabModalOpen}
        onClose={() => setCollabModalOpen(false)}
        collaborators={trip.collaborators}
      />
    </div>
  );
}
