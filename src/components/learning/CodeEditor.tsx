'use client';

import React, { useState } from 'react';
import { Copy, Check, RotateCcw, Code2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  onChange?: (code: string) => void;
  onRun?: (code: string) => void;
  isRunning?: boolean;
  readOnly?: boolean;
  className?: string;
}

export default function CodeEditor({
  initialCode = '# Write your solution here\n',
  language = 'python',
  onChange,
  onRun,
  isRunning = false,
  readOnly = false,
  className = '',
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
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

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 6) }, (_, i) => i + 1);

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-lg flex flex-col font-mono text-sm ${className}`}
    >
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Code2 size={15} className="text-saffron-500" />
          <span className="font-semibold text-slate-200 capitalize">{language}</span>
          <span className="text-slate-600">•</span>
          <span className="text-3xs text-slate-500">Auto-formatted</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
          {!readOnly && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset code"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="relative flex min-h-60 max-h-96 overflow-y-auto">
        {/* Line numbers column */}
        <div className="select-none py-3 px-3 text-right bg-slate-900/50 border-r border-slate-800/80 text-slate-600 text-xs shrink-0 w-10">
          {lineNumbers.map((n) => (
            <div key={n} className="leading-6">
              {n}
            </div>
          ))}
        </div>

        {/* Text area */}
        <textarea
          value={code}
          onChange={handleTextChange}
          readOnly={readOnly}
          spellCheck={false}
          className="w-full flex-1 p-3 bg-transparent text-slate-100 font-mono text-xs sm:text-sm leading-6 resize-none focus:outline-none focus:ring-0 selection:bg-saffron-500/30"
          rows={Math.max(lineCount, 8)}
        />
      </div>

      {/* Footer / Run action */}
      {onRun && !readOnly && (
        <div className="flex items-center justify-between p-3 bg-slate-900/90 border-t border-slate-800 text-xs">
          <span className="text-slate-500 text-3xs">
            Shift + Enter or click to evaluate solution
          </span>
          <Button
            type="button"
            onClick={() => onRun(code)}
            disabled={isRunning || !code.trim()}
            size="sm"
            className="bg-saffron-500 hover:bg-saffron-600 text-white font-semibold rounded-xl flex items-center gap-1.5 h-8 px-3"
          >
            <Play size={13} />
            <span>{isRunning ? 'Analyzing...' : 'Run & Check'}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
