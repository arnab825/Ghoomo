/**
 * Ghoomo Adaptive Learning Navigation Engine
 * Core Domain & Epistemic Types
 * Aligned with SIH 2026 Problem Statement 26207.
 */

export type KnowledgeState =
  | 'UNKNOWN'
  | 'EXPOSED'
  | 'PROVISIONALLY_READY'
  | 'DEVELOPING'
  | 'NEEDS_REVIEW'
  | 'MASTERED';

export type MasterySource =
  | 'diagnostic'
  | 'practice'
  | 'application'
  | 'prior_evidence';

export type ActivityType =
  | 'DIAGNOSE'
  | 'EXPLAIN'
  | 'PRACTICE'
  | 'APPLY'
  | 'REMEDIATE'
  | 'PROVE'
  | 'REFLECT';

export type RouteEventType =
  | 'DIAGNOSTIC_SKIPPED'
  | 'PREREQUISITE_INSERTED'
  | 'MISCONCEPTION_REROUTE'
  | 'DETOUR_INSERTED'
  | 'PROGRESSION_STEP'
  | 'MASTERY_UNLOCKED'
  | 'REMEDIATION_CLEARED';

export interface Concept {
  id: string;
  journeyId: string;
  name: string;
  slug: string;
  description: string;
  domain: string;
  moduleName?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  masteryThreshold: number;
  orderIndex: number;
  createdAt?: string;
}

export interface CuratedResource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'docs' | 'tutorial';
  platform: string;
  durationMinutes?: number;
  description?: string;
}

export interface ConceptPrerequisite {
  id?: string;
  conceptId: string;
  prerequisiteConceptId: string;
  createdAt?: string;
}

export interface LearnerConceptState {
  id?: string;
  userId: string;
  conceptId: string;
  state: KnowledgeState;
  masteryScore: number; // 0 - 100
  confidenceScore: number; // 0.0 - 1.0
  score?: number; // Alias for masteryScore
  confidence?: number; // Alias for confidenceScore
  evidenceCount: number;
  masterySource: MasterySource;
  evidenceSummary?: string | null;
  lastAssessedAt?: string;
  updatedAt?: string;
}

export interface LearningActivity {
  id: string;
  journeyId: string;
  conceptId: string;
  type: ActivityType;
  title: string;
  description: string;
  instructions?: string | null;
  thinkingPrompt?: string | null;
  hints?: string[];
  resources?: CuratedResource[];
  durationMinutes: number;
  isRemediation: boolean;
  orderIndex: number;
  createdAt?: string;
  questions?: LearningQuestion[];
}

export interface LearningQuestion {
  id: string;
  activityId: string;
  conceptId: string;
  question: string;
  questionType: 'mcq' | 'open_ended';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  options?: string[];
  correctAnswer: string;
  explanation?: string | null;
  orderIndex: number;
}

export interface Attempt {
  id?: string;
  userId: string;
  activityId: string;
  questionId?: string | null;
  conceptId: string;
  submittedAnswer: string;
  isCorrect: boolean;
  confidenceScore: number;
  score: number;
  rationale?: string | null;
  timeSpentSeconds: number;
  createdAt?: string;
}

export interface Misconception {
  id: string;
  userId: string;
  conceptId: string;
  activityId: string;
  attemptId?: string | null;
  misconceptionTitle: string;
  diagnosis: string;
  confidence: number;
  remediationActivityId?: string | null;
  isResolved: boolean;
  createdAt?: string;
}

export interface Evidence {
  id: string;
  userId: string;
  journeyId: string;
  conceptId: string;
  activityId: string;
  evidenceType: 'text' | 'image' | 'link' | 'code';
  content: string;
  aiEvaluation?: string | null;
  verified: boolean;
  createdAt?: string;
}

export interface RouteEvent {
  id: string;
  userId: string;
  journeyId: string;
  triggerConceptId?: string | null;
  eventType: RouteEventType;
  reason: string;
  evidenceSummary?: string | null;
  previousAction?: string | null;
  newAction?: string | null;
  createdAt: string;
}

export interface NextBestAction {
  activityId: string;
  activityTitle: string;
  activityType: ActivityType;
  conceptId: string;
  conceptName: string;
  estimatedMinutes: number;
  whyThis: string;
  whyNow: string;
  whyNotAnother: string;
  evidenceFactors: string;
}

export interface RouteSequenceNode {
  conceptId: string;
  conceptName: string;
  activityType: ActivityType;
  isInserted?: boolean;
}

export interface RouteDiff {
  triggerReason: string;
  triggerConceptName: string;
  beforeSequence: RouteSequenceNode[];
  afterSequence: RouteSequenceNode[];
  netDurationChangeMinutes: number;
  nextActionTitle: string;
}

export interface GapAnalysisResult {
  blockedConcepts: string[];
  missingPrerequisites: string[];
  weakConcepts: string[];
  unresolvedMisconceptions: string[];
  safelySkippableConcepts: string[];
  readyEligibleConcepts: string[];
}

export interface LearningGoal {
  id: string;
  userId: string;
  title: string;
  targetDomain: string;
  targetDate?: string | null;
  dailyMinutes: number;
  status: 'active' | 'completed' | 'abandoned';
  createdAt?: string;
}

export interface LearningJourney {
  id: string;
  creatorId: string;
  goalId: string;
  title: string;
  description: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'archived';
  baselineActivityCount: number;
  readinessScore: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningEfficiencyMetric {
  baselineActivityCount: number;
  personalizedActivityCount: number;
  avoidedActivityCount: number;
  estimatedMinutesAvoided: number;
  reason: string;
}
