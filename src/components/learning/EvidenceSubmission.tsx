'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import CodeEditor from './CodeEditor';
import { submitEvidenceAction, SubmitEvidenceResponse } from '@/app/actions/evidenceActions';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Code2,
  FileText,
  Workflow,
  ArrowRight,
  RotateCcw,
  Send,
  HelpCircle,
} from 'lucide-react';
import ProgressIndicator from '@/components/shared/ProgressIndicator';

interface EvidenceSubmissionProps {
  journeyId: string;
  conceptId: string;
  activityId: string;
  conceptName: string;
  onSuccess?: (response: SubmitEvidenceResponse) => void;
  className?: string;
}

type EvidenceMode = 'code' | 'reasoning' | 'trace';

export default function EvidenceSubmission({
  journeyId,
  conceptId,
  activityId,
  conceptName,
  onSuccess,
  className = '',
}: EvidenceSubmissionProps) {
  const [mode, setMode] = useState<EvidenceMode>('code');
  const [content, setContent] = useState('');
  const [timeComplexity, setTimeComplexity] = useState('');
  const [spaceComplexity, setSpaceComplexity] = useState('');
  const [edgeCases, setEdgeCases] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitEvidenceResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim() || content.trim().length < 10) {
      setErrorMsg('Please provide a substantive answer or solution before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Bundle additional work details if provided
    let bundledContent = content;
    if (timeComplexity || spaceComplexity || edgeCases) {
      bundledContent += '\n\n--- ADDITIONAL WORK & TRADEOFFS ---\n';
      if (timeComplexity) bundledContent += `Time Complexity: ${timeComplexity}\n`;
      if (spaceComplexity) bundledContent += `Space Complexity: ${spaceComplexity}\n`;
      if (edgeCases) bundledContent += `Edge Cases Handled: ${edgeCases}\n`;
    }

    try {
      const res = await submitEvidenceAction({
        journeyId,
        conceptId,
        activityId,
        evidenceType: mode === 'code' ? 'code' : 'text',
        content: bundledContent,
      });

      setResult(res);
      if (res.success && onSuccess) {
        onSuccess(res);
      } else if (!res.success && res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit evidence. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setErrorMsg(null);
    setContent('');
  };

  return (
    <div className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="text-3xs uppercase font-bold tracking-wider text-saffron-600 dark:text-saffron-400 flex items-center gap-1 mb-1">
            <Sparkles size={13} />
            <span>Show Your Work</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-white">
            Demonstrate Your Mastery of {conceptName}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit your solution or detailed reasoning to prove your capability and update your path.
          </p>
        </div>

        {/* Mode selector */}
        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'code'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code2 size={14} />
            <span>Code Solution</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('reasoning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'reasoning'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText size={14} />
            <span>Reasoning</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('trace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'trace'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Workflow size={14} />
            <span>Step Trace</span>
          </button>
        </div>
      </div>

      {/* If result already received, show AI feedback breakdown */}
      {result ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div
            className={`p-5 rounded-2xl border ${
              result.meetsThreshold
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {result.meetsThreshold ? (
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={24} />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400">
                    <AlertCircle size={24} />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-base font-heading">
                    {result.meetsThreshold
                      ? 'Demonstrated Understanding Confirmed!'
                      : 'Good Attempt — A Few Points to Clarify'}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    Score: <span className="font-bold">{result.score}%</span>{' '}
                    {result.promotedToMastered && '• You have mastered this topic!'}
                  </p>
                </div>
              </div>

              <ProgressIndicator
                value={result.score}
                variant="ring"
                size="sm"
                color={result.meetsThreshold ? 'emerald' : 'amber'}
                showLabel
              />
            </div>

            {/* AI Feedback notes */}
            <div className="mt-4 pt-4 border-t border-current/10 text-xs leading-relaxed space-y-2">
              <div className="font-semibold uppercase tracking-wider text-3xs opacity-75">
                AI Feedback
              </div>
              <div className="whitespace-pre-line bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-xl border border-current/10">
                {result.evaluationNotes}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleReset} className="rounded-xl flex items-center gap-2">
              <RotateCcw size={15} />
              <span>Try Another Solution</span>
            </Button>
            {result.meetsThreshold && (
              <Button className="bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-xl flex items-center gap-2">
                <span>Continue Learning</span>
                <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Work input form */
        <div className="space-y-4">
          {mode === 'code' ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code2 size={14} className="text-saffron-500" />
                <span>Write Your Code</span>
              </label>
              <CodeEditor
                initialCode={content || `# Implement your solution for ${conceptName}\n\ndef solution():\n    pass\n`}
                language="python"
                onChange={setContent}
              />
            </div>
          ) : mode === 'trace' ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Workflow size={14} className="text-saffron-500" />
                <span>Algorithm Trace / Step Execution</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Walk through the execution step-by-step on an example input (e.g. Step 1: left=0, right=6, mid=3...)"
                rows={7}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-saffron-500"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText size={14} className="text-saffron-500" />
                <span>Explain in Your Own Words</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Explain the core intuition, how it works, and why this approach is chosen..."
                rows={7}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-saffron-500"
              />
            </div>
          )}

          {/* Optional Complexity / Edge Cases Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-3xs uppercase font-bold text-slate-400 mb-1 block">
                Time Complexity (e.g. O(n log n))
              </label>
              <input
                type="text"
                value={timeComplexity}
                onChange={(e) => setTimeComplexity(e.target.value)}
                placeholder="O(1), O(n), etc."
                className="h-9 w-full px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-saffron-500 font-mono"
              />
            </div>
            <div>
              <label className="text-3xs uppercase font-bold text-slate-400 mb-1 block">
                Space Complexity (e.g. O(1))
              </label>
              <input
                type="text"
                value={spaceComplexity}
                onChange={(e) => setSpaceComplexity(e.target.value)}
                placeholder="O(1), O(n), etc."
                className="h-9 w-full px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-saffron-500 font-mono"
              />
            </div>
            <div>
              <label className="text-3xs uppercase font-bold text-slate-400 mb-1 block">
                Edge Cases Considered
              </label>
              <input
                type="text"
                value={edgeCases}
                onChange={(e) => setEdgeCases(e.target.value)}
                placeholder="Empty input, single element, negative..."
                className="h-9 w-full px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-saffron-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-3xs text-slate-400">
              Evaluated by AI reasoning • Mastery decided deterministically
            </span>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-xl flex items-center gap-2 px-5"
            >
              <Send size={15} />
              <span>{isSubmitting ? 'Evaluating Your Work...' : 'Submit & Receive Feedback'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
