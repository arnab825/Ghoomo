'use client';

import React, { useState, useEffect } from 'react';
import { TripPoll, PollVote, PollType } from '@/lib/types/ghoomo';
import { pollService } from '@/lib/services/pollService';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Vote,
  Plus,
  CheckCircle2,
  Clock,
  Lock,
  ChevronRight,
  TrendingUp,
  X,
  Users,
  Sparkles
} from 'lucide-react';

interface LivePollWidgetProps {
  tripId: string;
  targetId?: string;
  targetTitle?: string;
  type?: PollType;
  compact?: boolean;
}

export default function LivePollWidget({
  tripId,
  targetId,
  targetTitle,
  type = 'place',
  compact = false,
}: LivePollWidgetProps) {
  const { currentUser } = useAuthStore();
  const [polls, setPolls] = useState<TripPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customQuestion, setCustomQuestion] = useState(
    targetTitle
      ? type === 'place'
        ? `Should we visit ${targetTitle}?`
        : type === 'budget'
        ? `Approve ₹ expense for ${targetTitle}?`
        : `Who will handle task: ${targetTitle}?`
      : ''
  );

  const fetchPolls = async () => {
    try {
      const data = await pollService.getTripPolls(tripId);
      setPolls(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, [tripId]);

  const handleVote = async (pollId: string, option: string) => {
    const updated = await pollService.castVote({
      pollId,
      userId: currentUser.id,
      username: currentUser.username || currentUser.name.toLowerCase().replace(/\s+/g, '_'),
      avatarUrl: currentUser.avatarUrl,
      voteOption: option,
    });

    if (updated) {
      setPolls((prev) => prev.map((p) => (p.id === pollId ? updated : p)));
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;

    const newPoll = await pollService.createPoll({
      tripId,
      createdBy: currentUser.id,
      creatorName: `@${currentUser.username || 'traveler'}`,
      type,
      targetId: targetId || `generic-${Date.now()}`,
      title: customQuestion.trim(),
    });

    setPolls((prev) => [newPoll, ...prev]);
    setIsModalOpen(false);
    setCustomQuestion('');
  };

  const handleClosePoll = async (pollId: string) => {
    await pollService.closePoll(pollId);
    setPolls((prev) => prev.map((p) => (p.id === pollId ? { ...p, status: 'closed' as const } : p)));
  };

  // Filter polls if specific targetId was provided
  const relevantPolls = targetId
    ? polls.filter((p) => p.targetId === targetId)
    : polls;

  if (compact) {
    const existingPoll = relevantPolls[0];

    if (!existingPoll) {
      return (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 dark:hover:bg-teal-900/60 px-2 py-1 rounded-md border border-teal-200 dark:border-teal-800 transition-all duration-100 cursor-pointer active:scale-[0.98]"
        >
          <Vote size={12} />
          <span>Start Poll</span>
        </button>
      );
    }

    const totalVotes = existingPoll.votes.length;
    const userVote = existingPoll.votes.find((v) => v.userId === currentUser.id);

    return (
      <div className="rounded-md border border-slate-200 bg-slate-50/80 p-2 text-xs space-y-1.5 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <Vote size={12} className="text-teal-600" /> Live Decision
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {totalVotes} vote{totalVotes === 1 ? '' : 's'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {existingPoll.options.map((opt) => {
            const count = existingPoll.votes.filter((v) => v.voteOption === opt).length;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isSelected = userVote?.voteOption === opt;

            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleVote(existingPoll.id, opt)}
                disabled={existingPoll.status === 'closed'}
                className={`relative overflow-hidden py-1 px-1.5 rounded-md border text-[11px] font-semibold transition-all duration-100 cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <div
                  className="absolute inset-0 bg-teal-500/10 dark:bg-teal-400/10 pointer-events-none transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
                <span className="relative z-10 block truncate">{opt} {pct}%</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Vote size={18} className="text-teal-600" />
            <span>Group Polls & Votes</span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time collaborative voting with your trip companions.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-md shadow-xs active:scale-[0.98] cursor-pointer"
        >
          <Plus size={14} className="mr-1" />
          <span>New Poll</span>
        </Button>
      </div>

      {relevantPolls.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center space-y-2 dark:border-slate-800 dark:bg-slate-900/30">
          <Vote size={28} className="mx-auto text-slate-400 stroke-[1.5]" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No active polls yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Friends disagreeing on a dinner spot, hotel, or budget item? Create a quick poll and let everyone vote.
          </p>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            className="text-xs mt-2 cursor-pointer shadow-xs"
          >
            Create First Poll
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relevantPolls.map((poll) => {
            const totalVotes = poll.votes.length;
            const userVote = poll.votes.find((v) => v.userId === currentUser.id);
            const isClosed = poll.status === 'closed';

            return (
              <div
                key={poll.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs space-y-3 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                      <span className="capitalize font-semibold text-teal-700 dark:text-teal-400">
                        {poll.type} poll
                      </span>
                      <span>•</span>
                      <span>By {poll.creatorName || 'Companion'}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {poll.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    {isClosed ? (
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1">
                        <Lock size={10} /> Closed
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-sm border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <Clock size={10} /> Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Vote Options Breakdown */}
                <div className="space-y-2">
                  {poll.options.map((opt) => {
                    const votesForOpt = poll.votes.filter((v) => v.voteOption === opt);
                    const count = votesForOpt.length;
                    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    const isSelected = userVote?.voteOption === opt;

                    return (
                      <div key={opt} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => handleVote(poll.id, opt)}
                          disabled={isClosed}
                          className={`w-full flex items-center justify-between p-2 rounded-md border text-xs font-semibold transition-all duration-100 cursor-pointer active:scale-[0.99] relative overflow-hidden ${
                            isSelected
                              ? 'border-teal-600 bg-teal-50/70 text-teal-800 dark:bg-teal-950 dark:text-teal-200 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div
                            className="absolute inset-0 bg-teal-500/15 pointer-events-none transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                          <div className="relative z-10 flex items-center gap-2">
                            <span className="h-4 w-4 rounded-full border flex items-center justify-center text-[9px]">
                              {isSelected ? '✓' : ''}
                            </span>
                            <span>{opt}</span>
                          </div>
                          <div className="relative z-10 flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-300">
                            <span>{pct}%</span>
                            <span className="text-[10px] text-slate-400">({count})</span>
                          </div>
                        </button>

                        {/* Avatars of voters */}
                        {votesForOpt.length > 0 && (
                          <div className="flex items-center gap-1 pl-2">
                            <span className="text-[10px] text-slate-400">Voters:</span>
                            <div className="flex -space-x-1.5">
                              {votesForOpt.slice(0, 4).map((v) => (
                                <div
                                  key={v.id}
                                  title={`@${v.username}`}
                                  className="h-4 w-4 rounded-full bg-slate-200 border border-white dark:border-slate-800 text-[8px] flex items-center justify-center font-bold text-slate-700 overflow-hidden"
                                >
                                  {v.avatarUrl ? (
                                    <img src={v.avatarUrl} alt={v.username} className="h-full w-full object-cover" />
                                  ) : (
                                    v.username.charAt(0).toUpperCase()
                                  )}
                                </div>
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {votesForOpt.map((v) => `@${v.username}`).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <span>{totalVotes} total votes recorded</span>
                  {!isClosed && (
                    <button
                      type="button"
                      onClick={() => handleClosePoll(poll.id)}
                      className="text-slate-400 hover:text-slate-700 text-[10px] underline cursor-pointer"
                    >
                      Close Poll
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl space-y-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Vote size={18} className="text-teal-600" />
                <span>Create Group Poll</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Poll Question / Decision
                </label>
                <input
                  type="text"
                  required
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="e.g. Should we hike to Tosh Waterfall on Day 2?"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Default Voting Options:
                </div>
                <div>• Yes / No / Maybe (with instant percentage updates)</div>
                <div>• Auto-closes in 24 hours or when creator ends it</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  Publish Poll
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
