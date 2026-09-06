'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GhoomoTrip } from '@/lib/types/ghoomo';
import { ControlledActionProposal } from '@/lib/types/travelVideoPipeline';
import { Button } from '@/components/ui/button';
import {
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  XCircle,
  Calendar,
  DollarSign,
  CheckSquare,
  ArrowRight,
  Vote,
  Compass,
} from 'lucide-react';
import { tripService } from '@/lib/services/tripService';

interface TripChatProps {
  trip: GhoomoTrip;
  onTripUpdated?: (updatedTrip: GhoomoTrip) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  senderName: string;
  text: string;
  timestamp: string;
  proposal?: ControlledActionProposal;
}

export default function TripChat({ trip, onTripUpdated }: TripChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      senderName: 'Ghoomo AI Assistant',
      text: `Hello! I am your AI travel assistant for ${trip.destinationRegion}. You can ask me to evaluate your schedule, fit new activities, adjust the budget, or coordinate group polls.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      senderName: 'You',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      // Build compact TripContext
      const tripContext = {
        trip_id: trip.id,
        destination: trip.destinationRegion,
        days: trip.durationDays,
        budget: trip.budgetTotal,
        travelers: 2,
        preferences: [trip.travelStyle],
        current_itinerary_summary: trip.days.map((d) => ({
          day: d.dayNumber,
          theme: d.theme,
          places: d.items.map((i) => i.place?.name || 'Sight'),
        })),
        open_todos: trip.checklistItems.filter((c) => !c.isCompleted).map((c) => c.title),
        active_polls: [],
      };

      const res = await fetch(`/api/trips/${trip.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          tripContext,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          senderName: 'Ghoomo AI Assistant',
          text: data.reply || 'Here is what I found for your trip.',
          timestamp: data.timestamp || new Date().toISOString(),
          proposal: data.actionProposal || undefined,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'Failed to receive response.');
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          senderName: 'Ghoomo AI Assistant',
          text: 'I could not process that request right now. Please try asking again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleApplyProposal = async (msgId: string, proposal: ControlledActionProposal) => {
    // Update local proposal status to CONFIRMED
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.proposal ? { ...m, proposal: { ...m.proposal, status: 'CONFIRMED' } } : m
      )
    );

    // Apply action mutations to trip state
    try {
      let updatedTrip = { ...trip };

      if (proposal.action_type === 'CREATE_TODO') {
        const newTitle = proposal.parameters?.title || proposal.description;
        const newTodo = {
          id: `todo-${Date.now()}`,
          tripId: trip.id,
          title: newTitle,
          category: (proposal.parameters?.category as any) || 'booking',
          isCompleted: false,
        };
        updatedTrip.checklistItems = [...(updatedTrip.checklistItems || []), newTodo];
      } else if (proposal.action_type === 'CHANGE_BUDGET') {
        if (proposal.parameters?.newBudgetTotal) {
          updatedTrip.budgetTotal = proposal.parameters.newBudgetTotal;
        }
      }

      tripService.saveLocalTrip(updatedTrip);
      if (onTripUpdated) {
        onTripUpdated(updatedTrip);
      }

      // Append confirmation message
      setMessages((prev) => [
        ...prev,
        {
          id: `conf-${Date.now()}`,
          sender: 'assistant',
          senderName: 'Ghoomo AI Assistant',
          text: `Action applied successfully: ${proposal.description}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      console.warn('Failed to apply proposal:', err);
    }
  };

  const handleDismissProposal = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.proposal ? { ...m, proposal: { ...m.proposal, status: 'FAILED' } } : m
      )
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-210px)] min-h-100 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-saffron-500/20 to-teal-500/20 border border-saffron-500/30 flex items-center justify-center text-saffron-600 shrink-0">
            <Bot size={16} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Trip Room & AI Assistant</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </h3>
            <p className="text-[10px] text-slate-500">Live context-aware planning assistant</p>
          </div>
        </div>
        <div className="text-[11px] font-medium text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
          {trip.destinationRegion}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isAi = msg.sender === 'assistant';
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isAi ? '' : 'flex-row-reverse'}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  isAi
                    ? 'bg-linear-to-br from-saffron-500 to-teal-600 text-white'
                    : 'bg-slate-700 text-white dark:bg-slate-800'
                }`}
              >
                {isAi ? <Bot size={14} /> : <User size={14} />}
              </div>

              <div className={`space-y-1.5 max-w-[82%] ${isAi ? '' : 'text-right'}`}>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{msg.senderName}</span>
                  <span>•</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl text-xs leading-relaxed ${
                    isAi
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200/80 dark:border-slate-800'
                      : 'bg-saffron-500 text-white rounded-tr-xs shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Controlled Action Proposal Card (Section 28 & 56) */}
                {msg.proposal && (
                  <div className="mt-2 p-3 rounded-lg border border-saffron-500/30 bg-saffron-500/5 dark:bg-saffron-500/10 space-y-2 text-left">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-saffron-600 dark:text-saffron-400">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={12} />
                        Action Proposed: {msg.proposal.action_type.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          msg.proposal.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : msg.proposal.status === 'FAILED'
                            ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-saffron-100 text-saffron-700 dark:bg-saffron-950 dark:text-saffron-300'
                        }`}
                      >
                        {msg.proposal.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {msg.proposal.description}
                    </p>

                    {msg.proposal.status === 'PROPOSED' && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleApplyProposal(msg.id, msg.proposal!)}
                          className="bg-saffron-500 hover:bg-saffron-600 text-white text-xs h-7 px-3 rounded-md enabled:cursor-pointer disabled:cursor-not-allowed shadow-xs"
                        >
                          <CheckCircle2 size={12} className="mr-1" />
                          <span>Confirm & Apply</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDismissProposal(msg.id)}
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs h-7 px-2 enabled:cursor-pointer disabled:cursor-not-allowed"
                        >
                          <XCircle size={12} className="mr-1" />
                          <span>Dismiss</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="px-4 py-1.5 flex gap-1.5 overflow-x-auto border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 text-[11px] text-slate-600 dark:text-slate-400">
        <button
          type="button"
          onClick={() => {
            setInputText('Can we fit a relaxing beach afternoon into Day 2?');
          }}
          className="whitespace-nowrap px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-saffron-500 transition-colors"
        >
          🏖️ Fit a beach afternoon
        </button>
        <button
          type="button"
          onClick={() => {
            setInputText('Which activities in the plan came directly from the Reel?');
          }}
          className="whitespace-nowrap px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-saffron-500 transition-colors"
        >
          🎬 Creator vs AI places
        </button>
        <button
          type="button"
          onClick={() => {
            setInputText('Create a group poll for dinner options');
          }}
          className="whitespace-nowrap px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-saffron-500 transition-colors"
        >
          🗳️ Start group poll
        </button>
      </div>

      {/* Chat Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask AI about your ${trip.destinationRegion} trip or propose schedule edits...`}
          className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-saffron-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
        />
        <Button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="bg-linear-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white text-xs px-3.5 py-2 rounded-lg enabled:cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
        >
          <Send size={14} />
        </Button>
      </form>
    </div>
  );
}
