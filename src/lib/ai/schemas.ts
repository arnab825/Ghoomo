import { z } from 'zod';

// ============================================================================
// 1. Candidate Concept DAG Extraction Schema
// ============================================================================
export const candidateConceptNodeSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.preprocess(
    (v) => (typeof v === 'string' ? v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') : v),
    z.string().min(1).max(100)
  ),
  description: z.string().min(2).max(800).default('Concept overview'),
  domain: z.string().min(1).max(80).default('General'),
  moduleName: z.string().min(1).max(120).default('Core Fundamentals'),
  difficulty: z.preprocess(
    (v) => (typeof v === 'string' ? v.toLowerCase() : v),
    z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate')
  ),
  masteryThreshold: z.preprocess(
    (v) => (typeof v === 'number' ? Math.round(v) : 80),
    z.number().int().min(40).max(100).default(80)
  ),
  orderIndex: z.preprocess(
    (v) => (typeof v === 'number' ? Math.round(v) : 0),
    z.number().int().min(0).default(0)
  ),
  prerequisiteSlugs: z.preprocess(
    (v) => (Array.isArray(v) ? v.map((s) => String(s).toLowerCase().replace(/[^a-z0-9-]/g, '-')) : []),
    z.array(z.string().min(1).max(100)).default([])
  ),
  confidence: z.preprocess(
    (v) => (typeof v === 'number' ? v : 0.9),
    z.number().min(0).max(1).default(0.9)
  ),
});

export const candidateConceptGraphSchema = z.object({
  title: z.string().min(2).max(150).default('Learning Goal'),
  description: z.string().min(5).max(800).default('Adaptive learning curriculum'),
  subject: z.string().min(2).max(80).default('General'),
  baselineEstimatedActivities: z.preprocess(
    (v) => (typeof v === 'number' ? Math.round(v) : 20),
    z.number().int().min(1).max(100).default(20)
  ),
  concepts: z.array(candidateConceptNodeSchema).min(2).max(60),
});

export type CandidateConceptNode = z.infer<typeof candidateConceptNodeSchema>;
export type CandidateConceptGraph = z.infer<typeof candidateConceptGraphSchema>;

// ============================================================================
// 2. Candidate Diagnostic Question Set Schema
// ============================================================================
export const candidateDiagnosticQuestionSchema = z.object({
  conceptSlug: z.preprocess(
    (v) => (typeof v === 'string' ? v.toLowerCase().replace(/[^a-z0-9-]/g, '-') : v),
    z.string().min(1).max(100)
  ),
  question: z.string().min(5).max(600),
  questionType: z.preprocess((v) => {
    if (typeof v === 'string') {
      const s = v.toLowerCase().trim();
      if (s === 'multiple_choice' || s === 'multiple-choice' || s === 'multiplechoice') return 'mcq';
      if (s === 'debug' || s === 'code-debug') return 'code_debug';
      if (s === 'output' || s === 'code-output') return 'code_output';
      return s;
    }
    return 'mcq';
  }, z.enum(['mcq', 'code_output', 'code_debug', 'reasoning', 'complexity']).default('mcq')),
  codeSnippet: z.preprocess(
    (v) => (v === null || v === undefined ? '' : String(v)),
    z.string().max(3000).optional().default('')
  ),
  options: z.array(z.string().min(1)).min(2).max(8),
  correctAnswer: z.string().min(1),
  explanation: z.preprocess(
    (v) => (typeof v === 'string' ? v : 'Correct answer based on conceptual understanding.'),
    z.string().max(1000).default('Correct answer based on conceptual understanding.')
  ),
  testedPrerequisite: z.string().nullable().optional(),
});

export const candidateDiagnosticSetSchema = z.object({
  questions: z.array(candidateDiagnosticQuestionSchema).min(1).max(30),
});

export type CandidateDiagnosticQuestion = z.infer<typeof candidateDiagnosticQuestionSchema>;
export type CandidateDiagnosticSet = z.infer<typeof candidateDiagnosticSetSchema>;

// ============================================================================
// 3. Batch Blueprint Schema (Single-Call Goal Intake Artifact)
// Supports multi-module curricula, progressive questions, and curated resources
// ============================================================================
export const curatedResourceSchema = z.object({
  title: z.string().min(3).max(150),
  url: z.string().min(5).max(500),
  type: z.enum(['video', 'article', 'docs', 'tutorial']).default('article'),
  platform: z.string().min(2).max(60).default('Web'),
  durationMinutes: z.number().int().min(1).max(180).default(10).optional(),
  description: z.string().max(500).optional(),
});

export const blueprintQuestionSchema = z.object({
  question: z.string().min(5).max(600),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional().default('EASY'),
  options: z.array(z.string().min(1)).min(2).max(8),
  correctAnswer: z.string().min(1),
  explanation: z.preprocess(
    (v) => (typeof v === 'string' ? v : 'Correct solution verification.'),
    z.string().max(1000).default('Correct solution verification.')
  ),
  format: z.enum(['mcq', 'short_answer', 'code', 'trace', 'reasoning']).optional().default('mcq'),
});

export const blueprintPracticeDrillSchema = z.object({
  conceptSlug: z.preprocess(
    (v) => (typeof v === 'string' ? v.toLowerCase().replace(/[^a-z0-9-]/g, '-') : v),
    z.string().min(1).max(100)
  ),
  activityType: z.preprocess(
    (v) => (typeof v === 'string' ? v.toUpperCase() : v),
    z.enum(['EXPLAIN', 'PRACTICE', 'APPLY']).default('PRACTICE')
  ),
  activityTitle: z.string().min(2).max(150).default('Practice Drill'),
  activityDescription: z.string().min(2).max(800).default('Interactive exercise'),
  instructions: z.string().min(2).max(2000).default('Solve the problem to demonstrate mastery.'),
  durationMinutes: z.preprocess(
    (v) => (typeof v === 'number' ? Math.round(v) : 8),
    z.number().int().min(1).max(120).default(8)
  ),
  resources: z.array(curatedResourceSchema).default([]),
  questions: z.array(blueprintQuestionSchema).default([]),
  // Backward compatibility fields
  questionText: z.string().optional(),
  options: z.array(z.string().min(1)).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
});

export const candidateGoalBlueprintSchema = z.object({
  title: z.string().min(2).max(200).default('Personalized Learning Route'),
  description: z.string().min(2).max(1000).default('Adaptive competency-based learning path'),
  subject: z.string().min(1).max(100).default('General'),
  baselineEstimatedActivities: z.preprocess(
    (v) => (typeof v === 'number' ? Math.round(v) : 20),
    z.number().int().min(1).max(200).default(20)
  ),
  concepts: z.array(candidateConceptNodeSchema).min(2).max(80),
  diagnosticQuestions: z.array(candidateDiagnosticQuestionSchema).min(1).max(30),
  practiceDrills: z.array(blueprintPracticeDrillSchema).default([]),
});

export type CandidateGoalBlueprint = z.infer<typeof candidateGoalBlueprintSchema>;
export type BlueprintPracticeDrill = z.infer<typeof blueprintPracticeDrillSchema>;
export type BlueprintQuestion = z.infer<typeof blueprintQuestionSchema>;
export type CuratedResourceCandidate = z.infer<typeof curatedResourceSchema>;

// ============================================================================
// 4. Candidate Misconception Schema
// ============================================================================
export const candidateMisconceptionSchema = z.object({
  isMisconception: z.preprocess((v) => Boolean(v), z.boolean().default(false)),
  misconceptionTitle: z.preprocess(
    (v) => (v === null || v === undefined ? '' : String(v)),
    z.string().max(200).default('')
  ),
  diagnosis: z.preprocess(
    (v) => (v === null || v === undefined ? '' : String(v)),
    z.string().max(1000).default('')
  ),
  errorType: z.preprocess(
    (v) => {
      if (typeof v === 'string') {
        const lower = v.toLowerCase().trim();
        if (['conceptual', 'procedural', 'terminology', 'careless'].includes(lower)) return lower;
      }
      return 'careless';
    },
    z.enum(['conceptual', 'procedural', 'terminology', 'careless']).default('careless')
  ),
  confidence: z.preprocess(
    (v) => (typeof v === 'number' ? Math.min(1, Math.max(0, v)) : 0.5),
    z.number().min(0.0).max(1.0).default(0.5)
  ),
  remediationTitle: z.preprocess(
    (v) => (v === null || v === undefined ? '' : String(v)),
    z.string().max(200).default('')
  ),
  remediationInstruction: z.preprocess(
    (v) => (v === null || v === undefined ? '' : String(v)),
    z.string().max(2000).default('')
  ),
  remediationThinkingPrompt: z.preprocess(
    (v) => (v === null || v === undefined ? '' : String(v)),
    z.string().max(1000).optional().default('')
  ),
});

export type CandidateMisconception = z.infer<typeof candidateMisconceptionSchema>;

// ============================================================================
// 5. Candidate Evidence Evaluation Schema
// ============================================================================
export const candidateEvidenceEvaluationSchema = z.object({
  score: z.preprocess((v) => (typeof v === 'number' ? Math.round(v) : 0), z.number().min(0).max(100).default(0)),
  meetsThreshold: z.preprocess((v) => Boolean(v), z.boolean().default(false)),
  evaluationNotes: z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().max(1000).default('')),
  demonstratedStrengths: z.array(z.string()).default([]),
  identifiedGaps: z.array(z.string()).default([]),
});

export type CandidateEvidenceEvaluation = z.infer<typeof candidateEvidenceEvaluationSchema>;

// ============================================================================
// 6. Candidate Resource Ingestion Extraction Schema
// ============================================================================
export const candidateResourceExtractionSchema = z.object({
  title: z.string().min(2).max(200).default('Resource Overview'),
  summary: z.string().min(2).max(1000).default('Resource summary content.'),
  extractedConceptNames: z.array(z.string().min(1).max(100)).default([]),
  pedagogicalModality: z.preprocess(
    (v) => (typeof v === 'string' ? v.toLowerCase().trim() : 'reading'),
    z.enum(['visual', 'reading', 'practice', 'case_study']).default('reading')
  ),
  estimatedReadMinutes: z.preprocess(
    (v) => (typeof v === 'number' ? Math.round(v) : 10),
    z.number().int().min(1).max(180).default(10)
  ),
});

export type CandidateResourceExtraction = z.infer<typeof candidateResourceExtractionSchema>;
