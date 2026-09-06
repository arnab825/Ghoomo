/**
 * Ghoomo - Smart Learning Journeys Domain Types
 * Aligned with Smart India Hackathon 2026 Problem Statement 26207 (Smart Education).
 *
 * Core Concept:
 * CONTENT -> KNOWLEDGE -> LEARNING OBJECTIVES -> LOCATION/CONTEXT -> ACTIVITIES -> ASSESSMENT -> REFLECTION -> MASTERY
 */

export type LearningMode = 'digital' | 'explore' | 'travel';

export type BloomsTaxonomy =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export type ActivityStage = 'before' | 'during' | 'after';

export type ActivityType =
  | 'briefing'
  | 'observation'
  | 'mission'
  | 'quiz'
  | 'reflection'
  | 'hands_on';

export interface LearningObjective {
  id: string;
  journeyId: string;
  text: string;
  bloomsLevel: BloomsTaxonomy;
  isCompleted?: boolean;
}

export interface LearningQuestion {
  id: string;
  activityId: string;
  question: string;
  type: 'mcq' | 'open_ended';
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  hint?: string;
  selectedAnswer?: string | number;
}

export interface ActivitySubmission {
  text?: string;
  evidenceUrl?: string;
  submittedAt: string;
  aiFeedback?: string;
  score?: number;
}

export interface LearningActivity {
  id: string;
  journeyId: string;
  dayNumber: number;
  orderIndex: number;
  stage: ActivityStage; // before (prepare) | during (explore/mission) | after (assess/reflect)
  type: ActivityType;
  title: string;
  description: string;
  durationMinutes: number;
  placeId?: string;
  placeName?: string;
  lat?: number;
  lng?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  learningObjectiveId?: string;
  objectiveSnippet?: string;
  instruction?: string;
  thinkingPrompt?: string;
  fieldChecklist?: Array<{ id: string; label: string; checked?: boolean }>;
  bloomsLevel?: BloomsTaxonomy;
  quizQuestions?: LearningQuestion[];
  reflectionPrompt?: string;
  status: 'pending' | 'in_progress' | 'completed';
  submission?: ActivitySubmission;
}

export interface StudentProgress {
  journeyId: string;
  userId: string;
  completedActivityIds: string[];
  quizScores: Record<string, number>;
  totalScore: number;
  masteryPercentage: number;
  currentActivityId?: string;
  completedAt?: string;
}

export interface StudentReflection {
  id: string;
  journeyId: string;
  activityId?: string;
  prompt: string;
  studentResponse: string;
  aiFeedback?: string;
  rubricScores?: {
    conceptualUnderstanding?: number;
    fieldEvidence?: number;
    criticalSynthesis?: number;
  };
  createdAt: string;
}

export interface LearningSquadMember {
  id: string;
  name: string;
  email?: string;
  role: 'educator' | 'student' | 'mentor';
  avatarUrl?: string;
  progressPercentage: number;
}

export interface SourceProvenance {
  sourceType: 'topic' | 'youtube' | 'article' | 'text' | 'social_video';
  originalUrl?: string;
  title?: string;
  author?: string;
  extractedConcepts: string[];
  rawContentSnippet?: string;
  verifiedLocationsCount?: number;
  aiModelUsed?: string;
}

export interface TeacherAnalytics {
  totalLearners: number;
  completionRate: number;
  averageQuizMastery: number;
  activitiesCompletedCount: number;
  reflectionsSubmittedCount: number;
  commonMisconceptions?: string[];
}

export interface LearningJourney {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  mode: LearningMode;
  durationDays: number;
  coverImage: string;
  status: 'draft' | 'published' | 'completed';
  sourceProvenance?: SourceProvenance;
  objectives: LearningObjective[];
  activities: LearningActivity[];
  squad?: LearningSquadMember[];
  progress?: StudentProgress;
  studentProgress?: any;
  reflections: StudentReflection[];
  analytics?: TeacherAnalytics;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateJourneyParams {
  topicOrUrl: string;
  subject: string;
  gradeLevel: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  mode: LearningMode;
  durationDays: number;
  learningStyle?: 'visual' | 'activity_based' | 'reading' | 'multimodal';
  userNotes?: string;
}

export interface CopilotContext {
  journeyTitle: string;
  subject: string;
  gradeLevel: string;
  currentStopName?: string;
  currentActivityTitle?: string;
  currentActivityPrompt?: string;
  userMessage: string;
}
