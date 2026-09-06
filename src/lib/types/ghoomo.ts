// ============================================================================
// Ghoomo - Domain Types & Interfaces
// ============================================================================

export type PlatformType = 'instagram' | 'tiktok' | 'youtube' | 'blog' | 'other';
export type TravelStyle = 'solo' | 'couple' | 'friends' | 'family';
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
export type BudgetCategory = 'stay' | 'transport' | 'food' | 'activity' | 'shopping' | 'other';
export type ChecklistCategory = 'packing' | 'booking' | 'documents' | 'gear' | 'other';
export type CollabRole = 'editor' | 'viewer';

export interface TripSource {
  id: string;
  tripId: string;
  url: string;
  platform: PlatformType;
  title: string;
  author: string;
  thumbnailUrl: string;
  createdAt: string;
}

export interface Place {
  id: string;
  tripId: string;
  sourceId?: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  category: string;
  confidence: number; // 0.0 to 1.0
  isManual?: boolean;
  imageUrl?: string;
  notes?: string;
  assignedDay?: number; // 1..N or undefined if in unassigned radar
  timeSlot?: TimeSlot;
  createdAt: string;
}

export interface ItineraryItem {
  id: string;
  dayId: string;
  placeId: string;
  orderIndex: number;
  timeSlot: TimeSlot;
  durationMinutes: number;
  notes?: string;
  place?: Place;
}

export interface ItineraryDay {
  id: string;
  tripId: string;
  dayNumber: number;
  date?: string;
  theme: string;
  notes?: string;
  items: ItineraryItem[];
}

export interface Collaborator {
  id: string;
  email: string;
  name: string;
  role: CollabRole;
  avatarUrl?: string;
  status: 'pending' | 'accepted';
}

export interface BudgetItem {
  id: string;
  tripId: string;
  category: BudgetCategory;
  description: string;
  amount: number;
  isPaid: boolean;
}

export interface ChecklistItem {
  id: string;
  tripId: string;
  category: ChecklistCategory;
  title: string;
  isCompleted: boolean;
  assignedTo?: string;
}

export interface GhoomoTrip {
  id: string;
  userId?: string;
  title: string;
  destinationRegion: string;
  startDate?: string;
  durationDays: number;
  budgetTotal: number;
  travelStyle: TravelStyle;
  coverImage: string;
  status: 'draft' | 'planned' | 'ongoing' | 'completed';
  sources: TripSource[];
  places: Place[];
  days: ItineraryDay[];
  collaborators: Collaborator[];
  budgetItems: BudgetItem[];
  checklistItems: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Live Polling & Collaborative Voting
// ============================================================================

export type PollType = 'place' | 'budget' | 'task';

export interface PollVote {
  id: string;
  pollId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  voteOption: string;
  createdAt: string;
}

export interface TripPoll {
  id: string;
  tripId: string;
  createdBy?: string;
  creatorName?: string;
  type: PollType;
  targetId: string;
  title: string;
  options: string[];
  status: 'open' | 'closed';
  votes: PollVote[];
  closesAt?: string;
  createdAt: string;
}

// ============================================================================
// Monetization, Credits & Pricing Plans
// ============================================================================

export interface PricingPlan {
  id: 'starter' | 'explorer' | 'unlimited';
  name: string;
  price: number; // in INR
  credits: number;
  description: string;
  badge?: string;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 249,
    credits: 30,
    description: 'Perfect for weekend trips',
    features: [
      '30 AI Credits included',
      '10 Full AI Trip Generations',
      '30 Social Reel Extractions',
      'Full Collaborative Workspaces',
      'Interactive Route Maps & Export',
    ],
  },
  {
    id: 'explorer',
    name: 'Explorer',
    price: 699,
    credits: 100,
    description: 'Best for multiple trips',
    badge: 'Most Popular',
    features: [
      '100 AI Credits included',
      '33+ Full AI Trip Generations',
      '100 Social Reel Extractions',
      'Priority Gemini 1.5 Flash AI Engine',
      'Live Team Polling & Realtime Sync',
      'Full Route & Proximity Optimization',
    ],
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: 1999,
    credits: 500,
    description: 'For serious travelers',
    features: [
      '500 AI Credits included',
      '165+ Full AI Trip Generations',
      'Unlimited Social Media Ingestion',
      'All Collaborative Editing & Polls',
      'Kaggle & India Tourism Reference Match',
      'Instant AI Enrichment & Route Buffers',
    ],
  },
];

export interface CreditTransaction {
  id: string;
  userId: string;
  orderId: string;
  paymentId?: string;
  planId: 'starter' | 'explorer' | 'unlimited';
  amount: number;
  creditsAdded: number;
  currency: string;
  status: 'created' | 'captured' | 'failed';
  createdAt: string;
}

