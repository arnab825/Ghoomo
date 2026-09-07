'use client';

import React, { useState } from 'react';
import {
  Lightbulb,
  Compass,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Code2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LessonSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  codeSnippet?: string;
  codeLanguage?: string;
}

interface RichContentRendererProps {
  topicName: string;
  description?: string;
  sections?: LessonSection[];
  className?: string;
}

export default function RichContentRenderer({
  topicName,
  description,
  sections,
  className = '',
}: RichContentRendererProps) {
  // Default structure if sections not passed
  const defaultSections: LessonSection[] = [
    {
      id: 'why',
      title: 'Why It Matters',
      icon: <Compass size={18} className="text-saffron-500" />,
      content:
        description ||
        `Understanding ${topicName} is a fundamental milestone. In production systems and real-world architectures, this concept prevents critical bottlenecks, ensures scalability, and unlocks clean problem decomposition.`,
    },
    {
      id: 'intuition',
      title: 'Intuitive Analogy',
      icon: <Lightbulb size={18} className="text-amber-500" />,
      content: `Think of ${topicName} like an optimized navigation system. Rather than exhaustively inspecting every single dead end, it uses structural invariants to eliminate half the search space or group related operations efficiently.`,
    },
    {
      id: 'core',
      title: 'Core Concept & Rules',
      icon: <BookOpen size={18} className="text-indigo-500" />,
      content: `1. Core Invariant: Always maintain prerequisite integrity before proceeding.\n2. State Transitions: Operations must preserve determinism.\n3. Complexity Guarantee: Designed to run efficiently with bounded memory overhead.`,
    },
    {
      id: 'pitfalls',
      title: 'Common Mistakes & Misconceptions',
      icon: <AlertTriangle size={18} className="text-rose-500" />,
      content: `• Off-by-one errors in boundary conditions.\n• Forgetting to account for empty or single-element inputs.\n• Confusing worst-case time complexity with amortized analysis.`,
    },
  ];

  const activeSections = sections && sections.length > 0 ? sections : defaultSections;
  const [expandedSectionIds, setExpandedSectionIds] = useState<string[]>(
    activeSections.map((s) => s.id)
  );

  const toggleSection = (id: string) => {
    setExpandedSectionIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {activeSections.map((section) => {
        const isExpanded = expandedSectionIds.includes(section.id);
        return (
          <div
            key={section.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs transition-all"
          >
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xs">
                  {section.icon}
                </div>
                <h4 className="font-bold text-sm sm:text-base font-heading text-slate-900 dark:text-white">
                  {section.title}
                </h4>
              </div>

              <div className="p-1 rounded-lg text-slate-400">
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {isExpanded && (
              <div className="p-4 sm:p-5 pt-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in duration-200 space-y-4">
                <div className="whitespace-pre-line">{section.content}</div>

                {section.codeSnippet && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200">
                    <div className="text-3xs uppercase font-bold text-slate-500 mb-2">
                      {section.codeLanguage || 'Example'}
                    </div>
                    <pre className="overflow-x-auto">
                      <code>{section.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
