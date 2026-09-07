'use client';

import React from 'react';
import Link from 'next/link';
import { Concept, LearnerConceptState, LearningActivity } from '@/lib/types/engine';
import AppDrawer from '@/components/shared/AppDrawer';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatLockReason, formatResourceType } from '@/lib/utils/terminology';
import { getCuratedResourcesForConcept } from '@/lib/learning/resourceCatalog';
import DuckDuckGoResourceFinder from '@/components/learning/DuckDuckGoResourceFinder';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
  Sparkles,
  ExternalLink,
  PlayCircle,
  HelpCircle,
  Compass,
  Code2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

interface TopicDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  concept: Concept | null;
  state: LearnerConceptState | null | undefined;
  prerequisiteNames: string[];
  isLocked: boolean;
  activity?: LearningActivity | null;
}

export default function TopicDetailDrawer({
  isOpen,
  onClose,
  concept,
  state,
  prerequisiteNames,
  isLocked,
  activity,
}: TopicDetailDrawerProps) {
  if (!concept) return null;

  const status = isLocked ? 'LOCKED' : state?.state || 'UNKNOWN';
  const studyGuide = getCuratedResourcesForConcept(concept.name, concept.domain);

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={concept.name}
      description={concept.domain || 'Computer Science Topic'}
      width="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-2xs text-slate-400">
            {isLocked ? 'Prerequisites required' : 'Ready to study'}
          </div>
          {activity && !isLocked ? (
            <Link
              href={`/app/learn/${activity.id}`}
              onClick={onClose}
              className="bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-xl flex items-center gap-2 px-4 py-2 text-xs transition-colors"
            >
              <span>Start Practice</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Button disabled variant="outline" className="rounded-xl">
              {isLocked ? 'Locked' : 'Select an unblocked topic'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-3xs uppercase tracking-wider font-bold text-slate-400 mb-1">
              Your Current Status
            </div>
            <StatusBadge status={status} size="md" />
          </div>

          {(state?.score !== undefined || state?.masteryScore !== undefined) && (
            <div className="text-right">
              <div className="text-3xs uppercase tracking-wider font-bold text-slate-400 mb-1">
                Score
              </div>
              <div className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                {state?.score ?? state?.masteryScore}%
              </div>
            </div>
          )}
        </div>

        {/* Lock warning if locked */}
        {isLocked && (
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <Lock size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                Topic is Locked
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                {formatLockReason(prerequisiteNames[0])}
              </p>
            </div>
          </div>
        )}

        {/* Topic Description */}
        <div>
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-saffron-500" />
            <span>What You&apos;ll Master</span>
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            {concept.description ||
              `Master the core principles of ${concept.name}, understand its practical trade-offs, and apply it to solve real-world problems.`}
          </p>
        </div>

        {/* Mental Model & Core Intuition */}
        {studyGuide?.mentalModel && (
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-2">
              <Lightbulb size={14} className="text-amber-500" />
              <span>Mental Model &amp; Core Intuition</span>
            </h4>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-amber-50/40 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-900/40">
              {studyGuide.mentalModel}
            </div>
          </div>
        )}

        {/* Worked Example */}
        {studyGuide?.workedExample && (
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-2">
              <Code2 size={14} className="text-saffron-500" />
              <span>Implementation Blueprint</span>
            </h4>
            <pre className="p-3.5 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
              <code>{studyGuide.workedExample}</code>
            </pre>
          </div>
        )}

        {/* Key Invariants */}
        {studyGuide?.keyInvariants && studyGuide.keyInvariants.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Key Invariants (Remember Always)</span>
            </h4>
            <ul className="space-y-2">
              {studyGuide.keyInvariants.map((inv, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-700 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-2"
                >
                  <span className="text-saffron-500 font-bold shrink-0">•</span>
                  <span>{inv}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Prerequisites */}
        <div>
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-2">
            <Compass size={14} className="text-saffron-500" />
            <span>Recommended First</span>
          </h4>
          {prerequisiteNames.length > 0 ? (
            <div className="space-y-2">
              {prerequisiteNames.map((name, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <span>{name}</span>
                  <span className="text-3xs text-slate-400">Prerequisite</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              Foundational concept. No prerequisites needed.
            </p>
          )}
        </div>

        {/* Authoritative Learning Sources */}
        <div>
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-2">
            <BookOpen size={14} className="text-saffron-500" />
            <span>Authoritative Learning Sources</span>
          </h4>

          {studyGuide?.resources && studyGuide.resources.length > 0 ? (
            <div className="space-y-2.5">
              {studyGuide.resources.map((res, i) => (
                <a
                  key={i}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-saffron-500 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-saffron-500 shrink-0">
                      {res.type === 'video' ? <PlayCircle size={16} /> : <BookOpen size={16} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-saffron-600 transition-colors">
                        {res.title}
                      </div>
                      <div className="text-3xs text-slate-400">
                        {formatResourceType(res.type)} • {res.platform}
                      </div>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-slate-400 group-hover:text-saffron-500 shrink-0 ml-2" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              Curated study materials will be recommended as you practice this topic.
            </p>
          )}

          {/* DuckDuckGo Live Material Discovery */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
            <DuckDuckGoResourceFinder
              conceptName={concept.name}
              domain={concept.domain}
            />
          </div>
        </div>
      </div>
    </AppDrawer>
  );
}
