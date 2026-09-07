/**
 * Ghoomo AI Model Router
 * Task-aware model selection with 3-tier fallback: Gemini → Groq → HuggingFace
 * Respects Vercel free-tier 10s serverless timeout (8s AI budget).
 */

export type AITask =
  | 'roadmap_extraction'    // Heavy: deep knowledge terrain generation
  | 'rich_content'          // Heavy: learning module generation
  | 'diagnostic_generation' // Standard: 5-question diagnostic set
  | 'misconception_analysis'// Standard: error root cause analysis
  | 'evidence_evaluation'   // Standard: open-ended submission evaluation
  | 'code_evaluation'       // Heavy: code submission analysis
  | 'resource_extraction'   // Lightweight: concept extraction from text
  | 'copilot_inquiry'       // Lightweight: guided hint generation
  | 'challenge_generation'; // Standard: real-world challenge creation

export type AIProvider = 'gemini' | 'groq' | 'huggingface';

export type TaskWeight = 'lightweight' | 'standard' | 'heavy';

export interface ModelConfig {
  provider: AIProvider;
  model: string;
  maxTokens: number;
  timeoutMs: number;
  temperature: number;
}

// Specified model families
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
] as const;

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'qwen/qwen3-27b',
] as const;

const HUGGINGFACE_MODELS = [
  'Qwen/Qwen2.5-72B-Instruct',
  'Qwen/Qwen2.5-Coder-32B-Instruct',
  'deepseek-ai/DeepSeek-V3',
] as const;

// Task → weight classification
const TASK_WEIGHTS: Record<AITask, TaskWeight> = {
  roadmap_extraction: 'heavy',
  rich_content: 'heavy',
  code_evaluation: 'heavy',
  diagnostic_generation: 'standard',
  misconception_analysis: 'standard',
  evidence_evaluation: 'standard',
  challenge_generation: 'standard',
  resource_extraction: 'lightweight',
  copilot_inquiry: 'lightweight',
};

// Rate limiting state (in-memory per serverless instance)
const rateLimitState = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(provider: AIProvider): boolean {
  const state = rateLimitState.get(provider);
  if (!state) return false;
  if (Date.now() > state.resetAt) {
    rateLimitState.delete(provider);
    return false;
  }
  return state.count >= getProviderLimit(provider);
}

function recordCall(provider: AIProvider): void {
  const now = Date.now();
  const state = rateLimitState.get(provider);
  if (!state || now > state.resetAt) {
    rateLimitState.set(provider, { count: 1, resetAt: now + 60_000 });
  } else {
    state.count++;
  }
}

function markRateLimited(provider: AIProvider): void {
  rateLimitState.set(provider, {
    count: 999,
    resetAt: Date.now() + 60_000,
  });
}

function getProviderLimit(provider: AIProvider): number {
  switch (provider) {
    case 'gemini': return 15;     // 15 RPM free tier
    case 'groq': return 30;      // 30 RPM free tier
    case 'huggingface': return 10; // conservative
    default: return 10;
  }
}

/**
 * Selects the optimal model chain for a given task.
 * Returns ordered list of models to try (first = preferred, rest = fallbacks).
 */
export function getModelChain(task: AITask): ModelConfig[] {
  const weight = TASK_WEIGHTS[task];
  const chain: ModelConfig[] = [];
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
  const hfKey = process.env.HUGGINGFACE_API_KEY;

  switch (weight) {
    case 'lightweight':
      // Prefer fastest: Groq (llama-8b) → Gemini → HuggingFace
      if (groqKey && !isRateLimited('groq')) {
        chain.push({
          provider: 'groq',
          model: GROQ_MODELS[1], // llama-3.1-8b-instant
          maxTokens: 1500,
          timeoutMs: 5000,
          temperature: 0.3,
        });
      }
      if (geminiKey && !isRateLimited('gemini')) {
        chain.push({
          provider: 'gemini',
          model: GEMINI_MODELS[0],
          maxTokens: 2000,
          timeoutMs: 6000,
          temperature: 0.3,
        });
      }
      if (hfKey && !isRateLimited('huggingface')) {
        chain.push({
          provider: 'huggingface',
          model: HUGGINGFACE_MODELS[0],
          maxTokens: 1500,
          timeoutMs: 7000,
          temperature: 0.3,
        });
      }
      break;

    case 'standard':
      // Balanced: Gemini → Groq (70b) → HuggingFace
      if (geminiKey && !isRateLimited('gemini')) {
        chain.push({
          provider: 'gemini',
          model: GEMINI_MODELS[0],
          maxTokens: 3000,
          timeoutMs: 7000,
          temperature: 0.3,
        });
      }
      if (groqKey && !isRateLimited('groq')) {
        chain.push({
          provider: 'groq',
          model: GROQ_MODELS[0], // llama-3.3-70b-versatile
          maxTokens: 3000,
          timeoutMs: 7000,
          temperature: 0.3,
        });
      }
      if (hfKey && !isRateLimited('huggingface')) {
        chain.push({
          provider: 'huggingface',
          model: HUGGINGFACE_MODELS[0],
          maxTokens: 3000,
          timeoutMs: 7000,
          temperature: 0.3,
        });
      }
      break;

    case 'heavy':
      // Strongest first: Gemini → Groq (70b) → HuggingFace (72B)
      if (geminiKey && !isRateLimited('gemini')) {
        chain.push({
          provider: 'gemini',
          model: GEMINI_MODELS[0],
          maxTokens: 6000,
          timeoutMs: 8000,
          temperature: 0.25,
        });
      }
      if (groqKey && !isRateLimited('groq')) {
        chain.push({
          provider: 'groq',
          model: GROQ_MODELS[0],
          maxTokens: 4000,
          timeoutMs: 8000,
          temperature: 0.25,
        });
      }
      if (hfKey && !isRateLimited('huggingface')) {
        chain.push({
          provider: 'huggingface',
          model: HUGGINGFACE_MODELS[0],
          maxTokens: 4000,
          timeoutMs: 8000,
          temperature: 0.25,
        });
      }
      break;
  }

  // Emergency fallback: always include at least one if any key exists
  if (chain.length === 0) {
    if (geminiKey) {
      chain.push({
        provider: 'gemini',
        model: GEMINI_MODELS[0],
        maxTokens: 2000,
        timeoutMs: 8000,
        temperature: 0.3,
      });
    } else if (groqKey) {
      chain.push({
        provider: 'groq',
        model: GROQ_MODELS[1],
        maxTokens: 1500,
        timeoutMs: 7000,
        temperature: 0.3,
      });
    }
  }

  return chain;
}

export { recordCall, markRateLimited, GEMINI_MODELS, GROQ_MODELS, HUGGINGFACE_MODELS };
