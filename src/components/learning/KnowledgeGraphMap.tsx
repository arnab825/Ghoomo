'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Concept, ConceptPrerequisite, LearnerConceptState, KnowledgeState, LearningActivity } from '@/lib/types/engine';
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight,
  BookOpen,
  PlayCircle,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCuratedResourcesForConcept } from '@/lib/learning/resourceCatalog';

interface KnowledgeGraphMapProps {
  concepts: Concept[];
  prerequisites: ConceptPrerequisite[];
  learnerStates: Map<string, LearnerConceptState>;
  activities?: LearningActivity[];
  onSelectConcept?: (concept: Concept) => void;
}

export default function KnowledgeGraphMap({
  concepts,
  prerequisites,
  learnerStates,
  activities = [],
  onSelectConcept,
}: KnowledgeGraphMapProps) {
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(
    concepts[0]?.id ?? null
  );

  // Index prerequisites: conceptId -> set of prerequisiteConceptIds
  const prereqMap = new Map<string, string[]>();
  for (const p of prerequisites) {
    if (!prereqMap.has(p.conceptId)) prereqMap.set(p.conceptId, []);
    prereqMap.get(p.conceptId)!.push(p.prerequisiteConceptId);
  }

  const selectedConcept = concepts.find((c) => c.id === selectedConceptId) || concepts[0];
  const selectedState = selectedConcept ? learnerStates.get(selectedConcept.id) : null;
  const selectedPrereqs = selectedConcept ? prereqMap.get(selectedConcept.id) || [] : [];
  const selectedPrereqNames = selectedPrereqs.map(
    (id) => concepts.find((c) => c.id === id)?.name || 'Prerequisite'
  );

  // Check if all prerequisites are mastered or provisionally ready
  const arePrereqsSatisfied = selectedPrereqs.every((pId) => {
    const s = learnerStates.get(pId);
    return s && (s.state === 'MASTERED' || s.state === 'PROVISIONALLY_READY');
  });

  const isLocked = selectedState?.state === 'UNKNOWN' && !arePrereqsSatisfied && selectedPrereqs.length > 0;
  const matchedActivity = selectedConcept ? activities.find((a) => a.conceptId === selectedConcept.id) : null;
  const studyGuide = selectedConcept
    ? getCuratedResourcesForConcept(selectedConcept.name, selectedConcept.domain)
    : null;

  function getStateStyle(state: KnowledgeState | undefined, locked: boolean) {
    if (locked) {
      return {
        badge: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800',
        dot: 'bg-slate-300 dark:bg-slate-700',
        icon: <Lock size={15} className="text-slate-400" />,
        label: 'Locked',
      };
    }

    switch (state) {
      case 'MASTERED':
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          dot: 'bg-emerald-500',
          icon: <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />,
          label: 'Mastered',
        };
      case 'PROVISIONALLY_READY':
        return {
          badge: 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
          dot: 'bg-sky-500',
          icon: <Sparkles size={15} className="text-sky-600 dark:text-sky-400" />,
          label: 'Already Familiar',
        };
      case 'NEEDS_REVIEW':
        return {
          badge: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 animate-pulse',
          dot: 'bg-amber-500',
          icon: <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" />,
          label: 'Needs Review',
        };
      case 'DEVELOPING':
        return {
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
          dot: 'bg-indigo-500',
          icon: <Clock size={15} className="text-indigo-600 dark:text-indigo-400" />,
          label: 'In Progress',
        };
      case 'EXPOSED':
        return {
          badge: 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          dot: 'bg-slate-400',
          icon: <Clock size={15} className="text-slate-500" />,
          label: 'Up Next',
        };
      default:
        return {
          badge: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
          dot: 'bg-slate-400',
          icon: <Clock size={15} className="text-slate-400" />,
          label: 'Up Next',
        };
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading">
            All Steps & Topics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any topic to explore free lessons, see helpful foundations, and practice.
          </p>
        </div>
        <span className="text-2xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          {concepts.length} Topics
        </span>
      </div>

      {/* Nodes List / Directed Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Interactive Graph Flow */}
        <div className="lg:col-span-2 space-y-2.5">
          {concepts.map((concept, idx) => {
            const state = learnerStates.get(concept.id);
            const prereqs = prereqMap.get(concept.id) || [];
            const prereqsMet = prereqs.every((pId) => {
              const s = learnerStates.get(pId);
              return s && (s.state === 'MASTERED' || s.state === 'PROVISIONALLY_READY');
            });
            const nodeLocked = (!state || state.state === 'UNKNOWN') && !prereqsMet && prereqs.length > 0;
            const style = getStateStyle(state?.state, nodeLocked);
            const isSelected = selectedConcept?.id === concept.id;

            return (
              <div
                key={concept.id}
                onClick={() => {
                  setSelectedConceptId(concept.id);
                  if (onSelectConcept) onSelectConcept(concept);
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/20 shadow-2xs'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/60 dark:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-slate-400 w-5 text-right">
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                      {style.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {concept.name}
                        </h4>
                        {concept.moduleName && (
                          <span className="hidden sm:inline-block text-3xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {concept.moduleName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {prereqs.length > 0
                          ? `Requires ${prereqs.length} earlier topic${prereqs.length > 1 ? 's' : ''}`
                          : 'First step — start here!'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-2xs font-semibold border ${style.badge}`}>
                    {style.label}
                  </span>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 1 Col: Contextual Inspector */}
        {selectedConcept && (
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 text-xs space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
                  Topic Overview
                </span>
                {selectedConcept.moduleName && (
                  <span className="text-3xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {selectedConcept.moduleName}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedConcept.name}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {selectedConcept.description}
              </p>
            </div>

            {/* Launch Action Button */}
            {matchedActivity ? (
              <div className="space-y-1.5">
                <Link href={`/app/learn/${matchedActivity.id}`} className="block">
                  <Button
                    className={`w-full text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 ${
                      isLocked
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : selectedState?.state === 'MASTERED'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : selectedState?.state === 'PROVISIONALLY_READY'
                        ? 'bg-sky-600 hover:bg-sky-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <span>
                      {selectedState?.state === 'MASTERED'
                        ? 'Review & Practice'
                        : selectedState?.state === 'PROVISIONALLY_READY'
                        ? 'Practice This Topic'
                        : isLocked
                        ? 'Preview Ahead'
                        : 'Start Lesson & Practice'}
                    </span>
                    <ArrowRight size={14} />
                  </Button>
                </Link>

                {isLocked && (
                  <p className="text-3xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <ShieldAlert size={12} className="shrink-0" />
                    <span>Prerequisites unresolved on guided route. Autonomous preview available.</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-2xs">
                Activity initializing for this node.
              </div>
            )}

            {/* Epistemic State Details */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Mastery Score:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedState?.masteryScore ?? 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Confidence Score:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedState?.confidenceScore ?? 0.0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Verified Evidence:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedState?.evidenceCount ?? 0} submission(s)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
                  {selectedState?.state || 'UNKNOWN'}
                </span>
              </div>
            </div>

            {/* Prerequisites */}
            <div>
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Prerequisites Required
              </span>
              {selectedPrereqNames.length > 0 ? (
                <ul className="space-y-1">
                  {selectedPrereqNames.map((name, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      <span>{name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-500">None (Foundational Entry)</span>
              )}
            </div>

            {/* Curated Resources Preview */}
            {studyGuide && studyGuide.resources.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
                  Curated Learning Sources
                </span>
                <div className="space-y-1.5">
                  {studyGuide.resources.map((res, i) => (
                    <a
                      key={i}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-900 hover:border-indigo-500 transition-colors group"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {res.type === 'video' ? (
                          <PlayCircle size={14} className="text-red-500 shrink-0" />
                        ) : res.type === 'docs' ? (
                          <BookOpen size={14} className="text-sky-500 shrink-0" />
                        ) : (
                          <BookOpen size={14} className="text-emerald-500 shrink-0" />
                        )}
                        <span className="truncate text-2xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {res.title}
                        </span>
                      </div>
                      <ExternalLink size={12} className="text-slate-400 shrink-0 ml-1" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
