// ============================================================================
// Travel Reel → Multimodal Travel Intelligence Pipeline Types
// ============================================================================

export type TravelIntent =
  | 'ITINERARY'
  | 'DESTINATION_GUIDE'
  | 'DESTINATION_RECOMMENDATION'
  | 'SEASONAL_RECOMMENDATION'
  | 'YEARLY_RECOMMENDATION'
  | 'TRAVEL_TIPS'
  | 'FOOD_TRAVEL'
  | 'HOTEL_TRAVEL'
  | 'TRAVEL_MONTAGE'
  | 'TRAVEL_VLOG'
  | 'MOTIVATIONAL_TRAVEL'
  | 'MULTI_DESTINATION'
  | 'UNKNOWN';

export type ProvenanceSource =
  | 'creator_speech'
  | 'creator_text'
  | 'creator_visual'
  | 'creator_multiple'
  | 'ai_recommendation'
  | 'user_added';

export type EvidenceSignalType =
  | 'speech'
  | 'visual'
  | 'text'
  | 'audio'
  | 'geographical'
  | 'temporal'
  | 'landmark'
  | 'inferred';

export interface SignalEvidence {
  type: EvidenceSignalType;
  description: string;
  timestamp?: string; // e.g. "00:14"
  confidence: number;  // 0.0 - 1.0
}

export interface CandidateDestination {
  name: string;
  confidence: number;
  evidence: SignalEvidence[];
  country?: string;
  region?: string;
}

export interface ExtractedPlaceEvidence {
  name: string;
  canonicalName?: string;
  type?: string; // city, landmark, beach, viewpoint, temple, restaurant, hotel, etc.
  source: 'speech' | 'visual' | 'text' | 'multiple';
  provenance: ProvenanceSource;
  confidence: number;
  timestamp?: string;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
  country?: string;
  notes?: string;
  estimatedVisitMinutes?: number;
}

export interface ExtractedActivity {
  name: string;
  confidence: number;
  source: 'speech' | 'visual' | 'text';
  timestamp?: string;
}

export interface TemporalContext {
  month?: string | null;
  season?: string | null;
  year?: number | null;
  relative_expression?: string | null; // e.g. "this year", "this September"
  resolved_month?: number | null;
  resolved_year?: number | null;
}

export interface ExtractedDuration {
  days: number | null;
  explicit: boolean;
  notes?: string;
}

export interface SpeechAnalysis {
  available: boolean;
  travel_relevance: number; // 0.0 to 1.0 (low for motivational/generic speech)
  summary?: string;
}

export interface TravelEvidence {
  is_travel_video: boolean;
  travel_confidence: number;
  video_type: TravelIntent;
  temporal_context: TemporalContext;
  destination_candidates: CandidateDestination[];
  primary_destination?: string;
  places: ExtractedPlaceEvidence[];
  activities: ExtractedActivity[];
  duration: ExtractedDuration;
  creator_recommendations: string[];
  speech: SpeechAnalysis;
  evidence: SignalEvidence[];
  raw_video_meta?: VideoMetadata;
}

export interface VideoMetadata {
  duration_seconds: number;
  width?: number;
  height?: number;
  fps?: number;
  mime_type: string;
  sha256: string;
  file_name?: string;
  file_size_bytes?: number;
  source_platform?: string;
  source_url: string;
}

export type JobStatus =
  | 'DOWNLOADING'
  | 'PROCESSING_VIDEO'
  | 'EXTRACTING_EVIDENCE'
  | 'RESOLVING_DESTINATION'
  | 'NEEDS_CONFIRMATION'
  | 'OPTIMIZING_TRIP'
  | 'GENERATING_ITINERARY'
  | 'VALIDATING'
  | 'READY'
  | 'FAILED';

export interface PipelinePreferences {
  budget?: 'budget' | 'medium' | 'luxury' | number;
  pace?: 'relaxed' | 'balanced' | 'fast';
  interests?: string[];
  duration?: number;
  travellers?: number;
  destination?: string; // Optional user override
  travelStyle?: 'solo' | 'couple' | 'friends' | 'family';
}

export interface JobLogEntry {
  stage: JobStatus;
  message: string;
  timestamp: string;
}

export interface VideoProcessingJob {
  id: string;
  url: string;
  status: JobStatus;
  progressPercent: number;
  preferences: PipelinePreferences;
  createdAt: string;
  updatedAt: string;
  logs: JobLogEntry[];
  metadata?: VideoMetadata;
  evidence?: TravelEvidence;
  destinationCandidates?: CandidateDestination[];
  resolvedDestination?: string;
  durationDays?: number;
  tripId?: string;
  trip?: any; // GhoomoTrip
  error?: string;
  observability?: {
    video_hash: string;
    processing_time_ms: number;
    gemini_calls: number;
    gemini_latency_ms: number;
    model: string;
    destination_confidence: number;
    travel_confidence: number;
  };
}

export interface BudgetEstimateBreakdown {
  currency: string;
  low: number;
  estimated: number;
  high: number;
  shared_costs: {
    accommodation: number;
    private_transport: number;
    guide_activities: number;
  };
  individual_costs_per_person: {
    food: number;
    entry_tickets: number;
    personal_misc: number;
  };
  total_trip_budget: number;
  budget_per_person: number;
  category_totals: {
    stay: number;
    transport: number;
    food: number;
    activity: number;
    misc: number;
  };
}

export interface TripContextSummary {
  trip_id: string;
  destination: string;
  days: number;
  budget: number;
  travelers: number;
  preferences: string[];
  current_itinerary_summary: Array<{
    day: number;
    theme: string;
    places: string[];
  }>;
  open_todos: string[];
  active_polls: string[];
}

export type ControlledActionType =
  | 'MOVE_ACTIVITY'
  | 'ADD_ACTIVITY'
  | 'REMOVE_ACTIVITY'
  | 'CHANGE_BUDGET'
  | 'CREATE_TODO'
  | 'CREATE_POLL';

export interface ControlledActionProposal {
  id: string;
  action_type: ControlledActionType;
  description: string;
  parameters: Record<string, any>;
  status: 'PROPOSED' | 'CONFIRMED' | 'EXECUTED' | 'FAILED';
  created_at: string;
}
