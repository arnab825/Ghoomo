'use client';

import React from 'react';
import Link from 'next/link';
import { Concept, LearnerConceptState, LearningActivity } from '@/lib/types/engine';
import AppDrawer from '@/components/shared/AppDrawer';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatLockReason, formatResourceType } from '@/lib/utils/terminology';
import { getCuratedResourcesForConcept } from '@/lib/learning/resourceCatalog';
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
  const resources = getCuratedResourcesForConcept(concept.name, concept.domain);

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={concept.name}
      description={concept.domain ? `Domain: ${concept.domain}` : 'Topic details'}
      width="lg"
      footer={
        <div className="w-full flex items-center justify-between gap-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Close
          </Button>
          {isLocked ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Lock size={14} className="shrink-0" />
              <span>Complete prerequisites first</span>
            </div>
          ) : activity ? (
            <Link href={`/app/learn/${activity.id}`}>
              <Button className="bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-xl flex items-center gap-2">
                <span>Start Practice</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
          ) : (
            <Button disabled className="rounded-xl">
              Activity preparing...
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status banner */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div>
            <div className="text-2xs uppercase tracking-wider font-bold text-slate-400 mb-1">
              Current Progress
            </div>
            <StatusBadge status={status} size="md" />
          </div>
          {((state?.score ?? state?.masteryScore ?? 0) > 0) && (
            <div className="text-right">
              <div className="text-2xs uppercase tracking-wider font-bold text-slate-400 mb-1">
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

        {/* Topic Description / What you'll learn */}
        <div>
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-saffron-500" />
            <span>What You&apos;ll Learn</span>
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            {concept.description ||
              `Master the core principles of ${concept.name}, understand its practical trade-offs, and apply it to solve real-world problems.`}
          </p>
        </div>

        {/* Prerequisites */}
        <div>
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-2">
            <Compass size={14} className="text-saffron-500" />
            <span>Learn This First</span>
          </h4>
          {prerequisiteNames.length > 0 ? (
            <div className="space-y-2">
              {prerequisiteNames.map((name, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <span>{name}</span>
                  <span className="text-2xs text-slate-400">Prerequisite</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              No prerequisites required. You can begin this topic right away!
            </p>
          )}
        </div>

        {/* Learning Resources */}
        <div>
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-2">
            <BookOpen size={14} className="text-saffron-500" />
            <span>Learning Resources</span>
          </h4>

          {resources ? (
            <div className="space-y-2.5">
              {/* Primary documentation */}
              <a
                href={resources.primaryDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-saffron-500 hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-saffron-600 transition-colors">
                      {resources.primaryDoc.title}
                    </div>
                    <div className="text-3xs text-slate-400">
                      {formatResourceType('docs')} • {resources.primaryDoc.platform}
                    </div>
                  </div>
                </div>
                <ExternalLink size={14} className="text-slate-400 group-hover:text-saffron-500 shrink-0 ml-2" />
              </a>

              {/* Video tutorial */}
              <a
                href={resources.videoTutorial.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-saffron-500 hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                    <PlayCircle size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-saffron-600 transition-colors">
                      {resources.videoTutorial.title}
                    </div>
                    <div className="text-3xs text-slate-400">
                      {formatResourceType('video')} • {resources.videoTutorial.platform}
                    </div>
                  </div>
                </div>
                <ExternalLink size={14} className="text-slate-400 group-hover:text-saffron-500 shrink-0 ml-2" />
              </a>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              Curated study materials will be recommended as you practice this topic.
            </p>
          )}
        </div>
      </div>
    </AppDrawer>
  );
}
