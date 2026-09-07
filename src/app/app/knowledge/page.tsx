"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase/client";
import { Concept, LearnerConceptState } from "@/lib/types/engine";
import {
  Map as MapIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  HelpCircle,
  Loader2,
} from "lucide-react";

export default function KnowledgeMapPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [states, setStates] = useState<Map<string, LearnerConceptState>>(
    new Map(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        // Fetch all concepts across user's active journeys
        const { data: cData } = await supabase
          .from("concepts")
          .select("*")
          .order("order_index", { ascending: true });

        const { data: sData } = await supabase
          .from("learner_concept_state")
          .select("*")
          .eq("user_id", user!.id);

        if (!isMounted) return;

        const conceptList: Concept[] = (cData || []).map((c) => ({
          id: c.id,
          journeyId: c.journey_id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          domain: c.domain,
          difficulty: c.difficulty,
          masteryThreshold: c.mastery_threshold,
          orderIndex: c.order_index,
          createdAt: c.created_at,
        }));
        setConcepts(conceptList);

        const stateMap = new Map<string, LearnerConceptState>();
        for (const s of sData || []) {
          stateMap.set(s.concept_id, {
            id: s.id,
            userId: s.user_id,
            conceptId: s.concept_id,
            state: s.state,
            masteryScore: Number(s.mastery_score),
            confidenceScore: Number(s.confidence_score),
            evidenceCount: s.evidence_count,
            masterySource: s.mastery_source,
            evidenceSummary: s.evidence_summary,
            lastAssessedAt: s.last_assessed_at,
            updatedAt: s.updated_at,
          });
        }
        setStates(stateMap);
      } catch (err) {
        console.error("Error loading knowledge states:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const filteredConcepts = concepts.filter((c) => {
    const s = states.get(c.id)?.state || "UNKNOWN";
    if (filterState !== "all" && s !== filterState) return false;
    if (
      searchQuery.trim() &&
      !c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const stateLabels: Record<string, string> = {
    all: "All Topics",
    MASTERED: "Mastered",
    PROVISIONALLY_READY: "Ready to Practice",
    DEVELOPING: "In Progress",
    NEEDS_REVIEW: "Needs Review",
    UNKNOWN: "Not Started",
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">
          Loading your learning map...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-heading">
          Your Learning Map
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore all the skills and topics in your curriculum, track what you've mastered, and discover what to learn next.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            "all",
            "MASTERED",
            "PROVISIONALLY_READY",
            "DEVELOPING",
            "NEEDS_REVIEW",
            "UNKNOWN",
          ].map((st) => (
            <button
              key={st}
              onClick={() => setFilterState(st)}
              className={`px-3 py-1.5 rounded-lg text-2xs font-bold transition-colors shrink-0 ${
                filterState === st
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {stateLabels[st] || st}
            </button>
          ))}
        </div>
      </div>

      {/* Concept Grid */}
      {filteredConcepts.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-500">
            No topics match your filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConcepts.map((c) => {
            const st = states.get(c.id);
            const stateValue = st?.state || "UNKNOWN";

            let badgeColor =
              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
            if (stateValue === "MASTERED")
              badgeColor =
                "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200";
            if (stateValue === "PROVISIONALLY_READY")
              badgeColor =
                "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200";
            if (stateValue === "NEEDS_REVIEW")
              badgeColor =
                "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200";

            return (
              <div
                key={c.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                    {c.domain}
                  </span>
                  <span
                    className={`text-2xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}
                  >
                    {stateLabels[stateValue] || stateValue}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {c.name}
                  </h3>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {c.description || "Core curriculum topic"}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-2xs">
                  <div>
                    <span className="text-slate-400 block">Progress</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {st?.masteryScore || 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Accuracy</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {Math.round((st?.confidenceScore || 0) * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Activities</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {st?.evidenceCount || 0} done
                    </span>
                  </div>
                </div>

                {st?.evidenceSummary && (
                  <div className="text-2xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                    {st.evidenceSummary}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
