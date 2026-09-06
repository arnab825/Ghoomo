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
