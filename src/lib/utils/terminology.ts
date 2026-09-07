/**
 * Ghoomo UI Terminology Dictionary
 * 
 * Non-negotiable UX Rule: The learner-facing interface must NEVER expose
 * internal engineering, AI, database, or mathematical educational jargon.
 * 
 * This dictionary provides central mapping from internal architecture concepts
 * to warm, friendly, plain-English labels suitable for learners of all ages (10 to 80+).
 */

export const LEARNER_TERMINOLOGY = {
  // Core Navigation & Concepts
  knowledge_graph: 'Learning Map',
  knowledge_terrain: 'Learning Roadmap',
  learning_journey: 'Learning Journey',
  concept: 'Topic',
  concepts: 'Topics',
  subconcept: 'Subtopic',
  subconcepts: 'Subtopics',
  concept_node: 'Topic',
  prerequisite: 'Learn this first',
  prerequisites: 'Recommended first',
  
  // Epistemic & Progress States
  epistemic_state: 'Your Progress',
  state_unknown: 'Not started',
  state_exposed: 'Introduced',
  state_provisionally_ready: 'Ready to move on',
  state_developing: 'In progress',
  state_needs_review: 'Idea to review',
  state_mastered: 'Mastered',
  state_skipped: 'Fast-tracked',
  state_locked: 'Locked',
  
  // Routing & Navigation
  adaptive_router: 'Your next best step',
  next_best_action: 'Next Best Step',
  route_event: 'Learning Path Update',
  route_recalculated: 'Your learning path has been updated',
  knowledge_gap: 'What to work on next',
  knowledge_gaps: 'Areas to practice',
  misconception: 'Idea to review',
  misconceptions: 'Ideas to clear up',
  misconception_detected: "Let's clear up this idea",
  
  // Activities & Demonstrating Ability
  learning_activity: 'Lesson',
  learning_activities: 'Lessons & Practice',
  activity_lesson: 'Lesson',
  activity_practice: 'Practice',
  activity_challenge: 'Challenge',
  diagnostic: 'Quick Starting Check',
  assessment: 'Practice & Challenges',
  assessment_engine: 'Practice Center',
  
  // Evidence & "Show Your Work"
  evidence: 'Your Work',
  evidence_submission: 'Show Your Work',
  show_your_work: 'Show Your Work',
  reasoning: 'Your Reasoning',
  code_submission: 'Your Solution',
  proof_submission: 'Your Derivation / Proof',
  trace_submission: 'Step-by-Step Trace',
  mastery_policy: 'What it takes to master this',
  
  // AI Feedback & Guidance
  ai_evaluation: 'AI Feedback',
  ai_feedback_positive: 'What you did well',
  ai_feedback_constructive: 'What needs work',
  ai_feedback_retry: 'Try again with this hint',
  ai_hint: 'Helpful Hint',
  ai_explanation: 'Quick Explanation',
  
  // Resources & Review
  resource_catalog: 'Learning Resources',
  resource_items: 'Study Materials',
  official_docs: 'Official Guide',
  recommended_video: 'Best Video',
  recommended_article: 'Recommended Article',
  interactive_tool: 'Interactive Practice',
  recommended_book: 'Deep-Dive Book',
  spaced_review: 'Smart Review',
  review_later: 'Review Later',
  
  // Internal tech (MUST NOT BE SHOWN)
  rag: '',
  agent: '',
  model_fallback: '',
  artifact_cache: '',
} as const;

export const ADMIN_TERMINOLOGY = {
  knowledge_graph: 'Roadmap Graph',
  concept: 'Topic',
  epistemic_state: 'Learning Progress',
  adaptive_router: 'Recommendation Engine',
  knowledge_gap: 'Learning Gap',
  misconception: 'Common Misconception',
  evidence: 'Submitted Evidence',
  mastery_policy: 'Mastery Criteria',
  route_event: 'Learning Path Changes',
  diagnostic: 'Starting Check',
  learning_activity: 'Learning Activity',
  resource_catalog: 'Learning Resources',
  spaced_review: 'Scheduled Review',
  ai_evaluation: 'AI Evaluation / Analysis',
  artifact_cache: 'Cached Responses',
  model_fallback: 'AI Provider Backup',
  system_health: 'System Health',
  user_growth: 'User Growth',
  active_learners: 'Active Learners',
} as const;

/**
 * Format internal epistemic state to plain English for the learner.
 */
export function formatLearnerState(state: string): string {
  switch (state?.toUpperCase()) {
    case 'UNKNOWN':
      return LEARNER_TERMINOLOGY.state_unknown;
    case 'EXPOSED':
      return LEARNER_TERMINOLOGY.state_exposed;
    case 'PROVISIONALLY_READY':
      return LEARNER_TERMINOLOGY.state_provisionally_ready;
    case 'DEVELOPING':
      return LEARNER_TERMINOLOGY.state_developing;
    case 'NEEDS_REVIEW':
      return LEARNER_TERMINOLOGY.state_needs_review;
    case 'MASTERED':
      return LEARNER_TERMINOLOGY.state_mastered;
    case 'SKIPPED':
      return LEARNER_TERMINOLOGY.state_skipped;
    case 'LOCKED':
      return LEARNER_TERMINOLOGY.state_locked;
    default:
      return state || 'In progress';
  }
}

/**
 * Format difficulty level to learner-friendly ladder description.
 */
export function formatDifficultyLevel(level: number | string): {
  name: string;
  description: string;
  levelNumber: number;
} {
  const num = typeof level === 'string' ? parseInt(level, 10) || 1 : level;
  switch (num) {
    case 1:
      return {
        name: 'Understand',
        description: 'Explain the core idea in your own words',
        levelNumber: 1,
      };
    case 2:
      return {
        name: 'Apply',
        description: 'Use the concept in a direct example',
        levelNumber: 2,
      };
    case 3:
      return {
        name: 'Reason',
        description: 'Debug, trace, compare, or explain tradeoffs',
        levelNumber: 3,
      };
    case 4:
      return {
        name: 'Solve',
        description: 'Solve a meaningful problem independently',
        levelNumber: 4,
      };
    case 5:
      return {
        name: 'Transfer',
        description: 'Apply to an unfamiliar real-world scenario',
        levelNumber: 5,
      };
    default:
      return {
        name: 'Practice',
        description: 'Demonstrate your understanding',
        levelNumber: 1,
      };
  }
}

/**
 * Friendly lock explanation avoiding raw node IDs or SQL states.
 */
export function formatLockReason(prerequisiteTopicTitle?: string): string {
  if (prerequisiteTopicTitle) {
    return `Learn ${prerequisiteTopicTitle} first. This topic builds directly on that idea.`;
  }
  return 'Complete earlier topics in your learning path to unlock this.';
}

/**
 * Friendly resource category tag.
 */
export function formatResourceType(type: string): string {
  switch (type?.toLowerCase()) {
    case 'docs':
    case 'official':
      return LEARNER_TERMINOLOGY.official_docs;
    case 'video':
      return LEARNER_TERMINOLOGY.recommended_video;
    case 'article':
    case 'guide':
      return LEARNER_TERMINOLOGY.recommended_article;
    case 'interactive':
    case 'practice':
      return LEARNER_TERMINOLOGY.interactive_tool;
    case 'book':
      return LEARNER_TERMINOLOGY.recommended_book;
    default:
      return 'Learning Resource';
  }
}
