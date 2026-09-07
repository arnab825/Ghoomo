'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Copy,
  Check,
  RotateCcw,
  Code2,
  Play,
  Terminal,
  FileCode,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamically import Monaco to prevent SSR hydration mismatch
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
      Loading Monaco Code Engine...
    </div>
  ),
});

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
  isHidden?: boolean;
}

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  testCases?: TestCase[];
  onChange?: (code: string) => void;
  onRun?: (code: string) => void;
  isRunning?: boolean;
  readOnly?: boolean;
  outputConsole?: string | null;
  aiEvaluationNotes?: string | null;
  className?: string;
}

export default function CodeEditor({
  initialCode = '# Write your solution here\ndef solution():\n    pass\n',
  language = 'python',
  testCases = [],
  onChange,
  onRun,
  isRunning = false,
  readOnly = false,
  outputConsole,
  aiEvaluationNotes,
  className = '',
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'tests' | 'output'>('editor');
  const [currentLanguage, setCurrentLanguage] = useState(language);

  const handleEditorChange = (value: string | undefined) => {
    const val = value || '';
    setCode(val);
    if (onChange) onChange(val);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(initialCode);
    if (onChange) onChange(initialCode);
  };

  const hasOutput = Boolean(outputConsole || aiEvaluationNotes);

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-xl flex flex-col font-mono text-sm ${className}`}
    >
      {/* Top Bar: Tabs, Language selector, Copy & Reset */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        {/* Left: Tab selection */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'editor'
                ? 'bg-slate-800 text-saffron-400 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileCode size={14} className="text-saffron-500" />
            <span>solution.{currentLanguage === 'python' ? 'py' : currentLanguage === 'javascript' ? 'js' : 'ts'}</span>
          </button>

          {testCases.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'tests'
                  ? 'bg-slate-800 text-saffron-400 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Test Cases ({testCases.length})</span>
            </button>
          )}

          {hasOutput && (
            <button
              type="button"
              onClick={() => setActiveTab('output')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'output'
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Terminal size={13} />
              <span>Output</span>
            </button>
          )}
        </div>

        {/* Right: Language badge + Actions */}
        <div className="flex items-center gap-2">
          <select
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 text-slate-300 text-2xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-saffron-500 cursor-pointer"
          >
            <option value="python">Python 3</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="sql">SQL</option>
          </select>

          <div className="h-4 w-px bg-slate-800" />

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
          {!readOnly && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset code"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === 'editor' && (
        <div className="relative min-h-72 max-h-125 overflow-hidden">
          <MonacoEditor
            height="320px"
            language={currentLanguage}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 },
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
            }}
          />
        </div>
      )}

      {/* Test Cases Tab */}
      {activeTab === 'tests' && (
        <div className="p-4 space-y-3 min-h-72 max-h-96 overflow-y-auto bg-slate-950">
          <div className="text-xs text-slate-400 mb-2">
            Verify your code against standard and edge-case inputs:
          </div>
          {testCases.map((tc, idx) => (
            <div
              key={tc.id || idx}
              className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">
                  Test Case {idx + 1} {tc.isHidden ? '(Hidden Test)' : ''}
                </span>
                {tc.passed !== undefined && (
                  <span
                    className={`flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-md ${
                      tc.passed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {tc.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    <span>{tc.passed ? 'PASSED' : 'FAILED'}</span>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-slate-500 mb-1">Input:</div>
                  <div className="text-slate-200">{tc.input}</div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-slate-500 mb-1">Expected Output:</div>
                  <div className="text-emerald-300">{tc.expectedOutput}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Output Console Tab */}
      {activeTab === 'output' && (
        <div className="p-4 space-y-3 min-h-72 max-h-96 overflow-y-auto bg-slate-950 text-xs">
          {aiEvaluationNotes ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-saffron-400 font-semibold text-xs">
                <Sparkles size={14} />
                <span>AI Engineering Analysis & Edge Cases</span>
              </div>
              <div className="whitespace-pre-line p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 leading-relaxed font-sans text-xs">
                {aiEvaluationNotes}
              </div>
              <div className="text-3xs text-slate-500 flex items-center gap-1.5">
                <AlertTriangle size={11} className="text-amber-500" />
                <span>Evaluated via rigorous static reasoning. Backend code sandbox execution pending.</span>
              </div>
            </div>
          ) : outputConsole ? (
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-slate-200 font-mono text-xs whitespace-pre-wrap">
              {outputConsole}
            </div>
          ) : (
            <div className="text-slate-500 italic">No output yet. Click &quot;Run &amp; Evaluate&quot; below.</div>
          )}
        </div>
      )}

      {/* Action Footer */}
      {onRun && !readOnly && (
        <div className="flex items-center justify-between p-3 bg-slate-900/90 border-t border-slate-800 text-xs">
          <span className="text-slate-500 text-3xs">
            Shift + Enter or click to evaluate solution
          </span>
          <Button
            type="button"
            onClick={() => {
              if (onRun) onRun(code);
              setActiveTab('output');
            }}
            disabled={isRunning || !code.trim()}
            size="sm"
            className="bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-xl flex items-center gap-1.5 h-8 px-3 transition-colors cursor-pointer"
          >
            <Play size={13} />
            <span>{isRunning ? 'Analyzing Code...' : 'Run & Evaluate'}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
