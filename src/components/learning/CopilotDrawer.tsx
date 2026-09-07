'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { askCopilotGuidedInquiryAction } from '@/app/actions/aiActions';
import { X, Send, Sparkles, MessageSquare, Globe, Loader2, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CopilotDrawerProps {
  goalTitle: string;
  conceptName: string;
  learnerState: string;
  activityTitle: string;
  detectedMisconception?: string | null;
}

export default function CopilotDrawer({
  goalTitle,
  conceptName,
  learnerState,
  activityTitle,
  detectedMisconception,
}: CopilotDrawerProps) {
  const { isCopilotOpen, setCopilotOpen } = useUIStore();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'copilot'; text: string }>>([
    {
      sender: 'copilot',
      text: `Hello! I am your AI Study Buddy. I can explain "${conceptName}", share simple examples, or give hints when you get stuck. What would you like to explore?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState('English');

  if (!isCopilotOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await askCopilotGuidedInquiryAction({
        goalTitle,
        conceptName,
        learnerState,
        activityTitle,
        detectedMisconception,
        userQuery: userMessage,
        preferredLanguage,
      });

      if (res.success) {
        setMessages((prev) => [...prev, { sender: 'copilot', text: res.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'copilot', text: 'I had trouble connecting right now. Try breaking the problem into a simpler question!' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'copilot', text: 'Service temporarily unavailable. Keep exploring the problem!' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputText(promptText);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Sparkles size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Study Buddy</h3>
            <p className="text-2xs text-slate-500 dark:text-slate-400">Personal Learning Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value)}
            className="text-2xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="English">EN</option>
            <option value="Hindi">हिंदी</option>
            <option value="Bengali">বাংলা</option>
          </select>

          <button
            onClick={() => setCopilotOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Context Badge */}
      <div className="px-4 py-2 bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-indigo-100/60 dark:border-indigo-950 text-2xs text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
        <span>Topic: {conceptName}</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Ready to help</span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-bl-none flex items-center gap-1.5">
              <Loader2 size={13} className="animate-spin" />
              <span>Formulating guided inquiry...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto text-2xs">
        <button
          type="button"
          onClick={() => handleQuickPrompt('Give me a simple real-world hint.')}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
        >
          💡 Give me a hint
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt('Show me a concrete analogy.')}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
        >
          🔍 Analogy
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt('Explain this simply in Hindi.')}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
        >
          🇮🇳 हिंदी में समझाइए
        </button>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask for guidance without answers..."
          className="flex-1 h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <Button type="submit" size="sm" disabled={!inputText.trim() || isLoading} className="h-9 w-9 p-0 bg-indigo-600 text-white">
          <Send size={14} />
        </Button>
      </form>
    </div>
  );
}
