import { supabase } from '@/lib/supabase/client';
import { TripPoll, PollVote, PollType } from '@/lib/types/ghoomo';

const LOCAL_POLLS_KEY = 'ghoomo_trip_polls_v2';

function getStoredPolls(): TripPoll[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_POLLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredPolls(polls: TripPoll[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_POLLS_KEY, JSON.stringify(polls));
  } catch (err) {
    console.error('Failed to save polls locally', err);
  }
}

export const pollService = {
  async getTripPolls(tripId: string): Promise<TripPoll[]> {
    // 1. Try Supabase query
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          id,
          trip_id,
          created_by,
          creator_name,
          type,
          target_id,
          title,
          options,
          status,
          closes_at,
          created_at,
          votes (
            id,
            poll_id,
            user_id,
            username,
            avatar_url,
            vote_option,
            created_at
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          tripId: p.trip_id,
          createdBy: p.created_by,
          creatorName: p.creator_name,
          type: p.type as PollType,
          targetId: p.target_id,
          title: p.title,
          options: Array.isArray(p.options) ? p.options : ['Yes', 'No', 'Maybe'],
          status: p.status as 'open' | 'closed',
          closesAt: p.closes_at,
          createdAt: p.created_at,
          votes: (p.votes || []).map((v: any) => ({
            id: v.id,
            pollId: v.poll_id,
            userId: v.user_id,
            username: v.username,
            avatarUrl: v.avatar_url,
            voteOption: v.vote_option,
            createdAt: v.created_at,
          })),
        }));
      }
    } catch {
      // Fall through to local storage fallback
    }

    const local = getStoredPolls();
    return local.filter((p) => p.tripId === tripId);
  },

  async createPoll(data: {
    tripId: string;
    createdBy?: string;
    creatorName?: string;
    type: PollType;
    targetId: string;
    title: string;
    options?: string[];
  }): Promise<TripPoll> {
    const defaultOptions =
      data.type === 'budget'
        ? ['Approve', 'Reject']
        : data.type === 'task'
        ? ['Assign to Me', 'Aarav', 'Sneha']
        : ['Yes', 'No', 'Maybe'];

    const newPoll: TripPoll = {
      id: `poll-${Date.now()}`,
      tripId: data.tripId,
      createdBy: data.createdBy,
      creatorName: data.creatorName || 'You',
      type: data.type,
      targetId: data.targetId,
      title: data.title,
      options: data.options || defaultOptions,
      status: 'open',
      votes: [],
      closesAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Try Supabase insert
    try {
      await supabase.from('polls').insert({
        id: newPoll.id,
        trip_id: newPoll.tripId,
        created_by: newPoll.createdBy || null,
        creator_name: newPoll.creatorName,
        type: newPoll.type,
        target_id: newPoll.targetId,
        title: newPoll.title,
        options: newPoll.options,
        status: newPoll.status,
      });
    } catch {
      // Ignore Supabase error in offline/demo mode
    }

    // Always update local cache
    const polls = getStoredPolls();
    saveStoredPolls([newPoll, ...polls]);

    return newPoll;
  },

  async castVote(vote: {
    pollId: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    voteOption: string;
  }): Promise<TripPoll | null> {
    // Try Supabase upsert
    try {
      await supabase.from('votes').upsert({
        poll_id: vote.pollId,
        user_id: vote.userId,
        username: vote.username,
        avatar_url: vote.avatarUrl || null,
        vote_option: vote.voteOption,
      });
    } catch {
      // Ignore
    }

    const polls = getStoredPolls();
    const pollIndex = polls.findIndex((p) => p.id === vote.pollId);
    if (pollIndex === -1) return null;

    const poll = polls[pollIndex];
    const filteredVotes = poll.votes.filter((v) => v.userId !== vote.userId);
    const newVote: PollVote = {
      id: `vote-${Date.now()}`,
      pollId: vote.pollId,
      userId: vote.userId,
      username: vote.username,
      avatarUrl: vote.avatarUrl,
      voteOption: vote.voteOption,
      createdAt: new Date().toISOString(),
    };

    const updatedPoll: TripPoll = {
      ...poll,
      votes: [...filteredVotes, newVote],
    };

    polls[pollIndex] = updatedPoll;
    saveStoredPolls(polls);

    return updatedPoll;
  },

  async closePoll(pollId: string): Promise<boolean> {
    try {
      await supabase.from('polls').update({ status: 'closed' }).eq('id', pollId);
    } catch {}

    const polls = getStoredPolls();
    const updated = polls.map((p) => (p.id === pollId ? { ...p, status: 'closed' as const } : p));
    saveStoredPolls(updated);
    return true;
  },
};
