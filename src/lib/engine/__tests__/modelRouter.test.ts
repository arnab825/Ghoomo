import {
  getModelChain,
  GEMINI_MODELS,
  GROQ_MODELS,
  HUGGINGFACE_MODELS,
} from '../../ai/modelRouter';

function runModelRouterTests() {
  console.log('\n--- Running Model Router Configuration Tests ---');

  // 1. Verify exact model lists match prompt specification
  const expectedGemini = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-flash-latest',
  ];
  if (JSON.stringify(GEMINI_MODELS) !== JSON.stringify(expectedGemini)) {
    throw new Error(`Gemini models mismatch: ${JSON.stringify(GEMINI_MODELS)}`);
  }

  const expectedGroq = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'qwen/qwen3.6-27b',
  ];
  if (JSON.stringify(GROQ_MODELS) !== JSON.stringify(expectedGroq)) {
    throw new Error(`Groq models mismatch: ${JSON.stringify(GROQ_MODELS)}`);
  }

  const expectedHf = [
    'Qwen/Qwen2.5-72B-Instruct',
    'Qwen/Qwen2.5-Coder-32B-Instruct',
    'Qwen/Qwen3.8-27B',
    'Qwen/Qwen3.8-Flash-Next',
    'deepseek-ai/DeepSeek-V4-Flash-0731',
  ];
  if (JSON.stringify(HUGGINGFACE_MODELS) !== JSON.stringify(expectedHf)) {
    throw new Error(`HuggingFace models mismatch: ${JSON.stringify(HUGGINGFACE_MODELS)}`);
  }

  // 2. Check that fallback chain adheres to 8000ms ceiling (under Vercel 10s serverless timeout)
  const heavyChain = getModelChain('roadmap_extraction');
  heavyChain.forEach((cfg) => {
    if (cfg.timeoutMs > 8000) {
      throw new Error(`Model ${cfg.model} timeout ${cfg.timeoutMs} exceeds 8000ms Vercel limit!`);
    }
  });

  console.log('✓ All Model Router & Fallback Configuration tests passed successfully.');
}

runModelRouterTests();
