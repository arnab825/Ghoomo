/**
 * Ghoomo Assessment Engine
 * Selects appropriate assessment modality based on concept domain and difficulty.
 * Manages adaptive difficulty progression.
 */

export type AssessmentModality =
  | 'mcq'
  | 'short_answer'
  | 'trace'
  | 'debug'
  | 'code'
  | 'design'
  | 'real_world'
  | 'proof'
  | 'reflection';

export type DifficultyLevel =
  | 'FOUNDATION'
  | 'EASY'
  | 'MEDIUM'
  | 'HARD'
  | 'APPLICATION'
  | 'TRANSFER';

export interface AssessmentStrategy {
  modalities: AssessmentModality[];
  difficultyProgression: DifficultyLevel[];
  minimumQuestionsPerLevel: number;
  skipThreshold: number; // Score above which we skip to next level
  dropThreshold: number; // Score below which we drop to previous level
}

/** Domain → Activity strategy mappings */
const DOMAIN_STRATEGIES: Record<string, AssessmentStrategy> = {
  programming: {
    modalities: ['mcq', 'trace', 'code', 'debug', 'design'],
    difficultyProgression: ['EASY', 'MEDIUM', 'HARD', 'APPLICATION'],
    minimumQuestionsPerLevel: 1,
    skipThreshold: 90,
    dropThreshold: 50,
  },
  'data structures': {
    modalities: ['mcq', 'trace', 'code', 'debug', 'design', 'real_world'],
    difficultyProgression: ['FOUNDATION', 'EASY', 'MEDIUM', 'HARD', 'APPLICATION', 'TRANSFER'],
    minimumQuestionsPerLevel: 1,
    skipThreshold: 90,
    dropThreshold: 50,
  },
  algorithms: {
    modalities: ['mcq', 'trace', 'code', 'design', 'proof'],
    difficultyProgression: ['FOUNDATION', 'EASY', 'MEDIUM', 'HARD', 'APPLICATION', 'TRANSFER'],
    minimumQuestionsPerLevel: 1,
    skipThreshold: 90,
    dropThreshold: 50,
  },
  mathematics: {
    modalities: ['mcq', 'short_answer', 'proof', 'real_world'],
    difficultyProgression: ['FOUNDATION', 'EASY', 'MEDIUM', 'HARD', 'APPLICATION'],
    minimumQuestionsPerLevel: 1,
    skipThreshold: 90,
    dropThreshold: 50,
  },
  science: {
    modalities: ['mcq', 'short_answer', 'real_world', 'reflection'],
    difficultyProgression: ['EASY', 'MEDIUM', 'HARD', 'APPLICATION'],
    minimumQuestionsPerLevel: 1,
    skipThreshold: 85,
    dropThreshold: 50,
  },
  language: {
    modalities: ['mcq', 'short_answer', 'reflection'],
    difficultyProgression: ['EASY', 'MEDIUM', 'HARD', 'APPLICATION'],
    minimumQuestionsPerLevel: 1,
    skipThreshold: 85,
    dropThreshold: 50,
  },
};

const DEFAULT_STRATEGY: AssessmentStrategy = {
  modalities: ['mcq', 'short_answer', 'real_world'],
  difficultyProgression: ['EASY', 'MEDIUM', 'HARD', 'APPLICATION'],
  minimumQuestionsPerLevel: 1,
  skipThreshold: 90,
  dropThreshold: 50,
};

/**
 * Resolves the assessment strategy for a given domain.
 */
export function getAssessmentStrategy(domain: string): AssessmentStrategy {
  const key = domain.toLowerCase().trim();
  return DOMAIN_STRATEGIES[key] || DEFAULT_STRATEGY;
}

/**
 * Selects the appropriate assessment modality for a concept based on
 * its position in the difficulty ladder and domain.
 */
export function selectModality(params: {
  domain: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  currentLevel: DifficultyLevel;
  previousModalities: AssessmentModality[];
}): AssessmentModality {
  const strategy = getAssessmentStrategy(params.domain);
  const available = strategy.modalities;

  // At FOUNDATION/EASY: prefer mcq, short_answer
  // At MEDIUM: prefer trace, debug
  // At HARD+: prefer code, design, real_world, proof
  const levelIndex = strategy.difficultyProgression.indexOf(params.currentLevel);
  const normalizedLevel = levelIndex / Math.max(1, strategy.difficultyProgression.length - 1);

  // Weight modalities by difficulty level
  const weighted: Array<{ modality: AssessmentModality; weight: number }> = available.map((m) => {
    let weight = 1;

    // MCQ is best for lower levels
    if (m === 'mcq') weight = normalizedLevel < 0.4 ? 3 : 1;
    // Trace/debug for middle levels
    if (m === 'trace' || m === 'debug') weight = normalizedLevel >= 0.3 && normalizedLevel <= 0.7 ? 3 : 1;
    // Code/design/real_world for higher levels
    if (m === 'code' || m === 'design' || m === 'real_world' || m === 'proof') {
      weight = normalizedLevel >= 0.5 ? 3 : 0;
    }
    // Reflection for highest levels
    if (m === 'reflection') weight = normalizedLevel >= 0.7 ? 2 : 0;

    // Penalize recently used modalities to encourage variety
    if (params.previousModalities.includes(m)) {
      weight *= 0.5;
    }

    return { modality: m, weight };
  });

  // Filter out zero-weight and sort by weight descending
  const candidates = weighted.filter((w) => w.weight > 0).sort((a, b) => b.weight - a.weight);

  return candidates[0]?.modality || 'mcq';
}

/**
 * Determines the next difficulty level based on performance.
 */
export function adaptDifficulty(params: {
  domain: string;
  currentLevel: DifficultyLevel;
  score: number;
  isCorrect: boolean;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}): DifficultyLevel {
  const strategy = getAssessmentStrategy(params.domain);
  const levels = strategy.difficultyProgression;
  const currentIndex = levels.indexOf(params.currentLevel);

  if (currentIndex === -1) return levels[0];

  // Skip up if performing well
  if (params.isCorrect && params.score >= strategy.skipThreshold && params.consecutiveCorrect >= 1) {
    const nextIndex = Math.min(currentIndex + 1, levels.length - 1);
    return levels[nextIndex];
  }

  // Drop down if struggling
  if (!params.isCorrect && params.score < strategy.dropThreshold && params.consecutiveIncorrect >= 2) {
    const prevIndex = Math.max(currentIndex - 1, 0);
    return levels[prevIndex];
  }

  // Stay at current level
  return params.currentLevel;
}

/**
 * Determines whether sufficient evidence has been gathered for a concept
 * at the current difficulty level.
 */
export function hassufficientEvidence(params: {
  domain: string;
  currentLevel: DifficultyLevel;
  attemptsAtLevel: number;
  correctAtLevel: number;
}): boolean {
  const strategy = getAssessmentStrategy(params.domain);

  // Need at least minimumQuestionsPerLevel correct answers at this level
  return params.correctAtLevel >= strategy.minimumQuestionsPerLevel;
}
