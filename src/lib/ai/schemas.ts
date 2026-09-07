import { z } from 'zod';

// ============================================================================
// 1. Candidate Concept DAG Extraction Schema
// ============================================================================
export const candidateConceptNodeSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().min(5).max(400).default('Concept overview'),
  domain: z.string().min(2).max(60).default('General'),
  moduleName: z.string().min(2).max(100).default('Core Fundamentals'),
  difficulty: z.preprocess(
    (v) => (typeof v === 'string' ? v.toLowerCase() : v),
    z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate')
  ),
  masteryThreshold: z.number().int().min(50).max(100).default(80),
  orderIndex: z.number().int().min(0).default(0),
  prerequisiteSlugs: z.array(z.string().min(2).max(80)).default([]),
  confidence: z.number().min(0).max(1).default(0.9),
});

export const candidateConceptGraphSchema = z.object({
  title: z.string().min(2).max(120).default('Learning Goal'),
  description: z.string().min(5).max(500).default('Adaptive learning curriculum'),
  subject: z.string().min(2).max(60).default('General'),
  baselineEstimatedActivities: z.number().int().min(3).max(100).default(20),
  concepts: z.array(candidateConceptNodeSchema).min(3).max(60),
});

export type CandidateConceptNode = z.infer<typeof candidateConceptNodeSchema>;
export type CandidateConceptGraph = z.infer<typeof candidateConceptGraphSchema>;

// ============================================================================
// 2. Candidate Diagnostic Question Set Schema
// ============================================================================
export const candidateDiagnosticQuestionSchema = z.object({
  conceptSlug: z.string().min(2).max(80),
  question: z.string().min(5).max(300),
  options: z.array(z.string().min(1)).min(3).max(4),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(5).max(400).default('Correct answer based on conceptual understanding.'),
  testedPrerequisite: z.string().optional(),
});

export const candidateDiagnosticSetSchema = z.object({
  questions: z.array(candidateDiagnosticQuestionSchema).min(3).max(25),
});

export type CandidateDiagnosticQuestion = z.infer<typeof candidateDiagnosticQuestionSchema>;
export type CandidateDiagnosticSet = z.infer<typeof candidateDiagnosticSetSchema>;

// ============================================================================
// 3. Batch Blueprint Schema (Single-Call Goal Intake Artifact)
// Supports multi-module curricula, progressive questions, and curated resources
// ============================================================================
export const curatedResourceSchema = z.object({
  title: z.string().min(3).max(120),
  url: z.string().min(5).max(500),
  type: z.enum(['video', 'article', 'docs', 'tutorial']).default('article'),
  platform: z.string().min(2).max(60).default('Web'),
  durationMinutes: z.number().int().min(1).max(180).default(10).optional(),
  description: z.string().max(300).optional(),
});

export const blueprintQuestionSchema = z.object({
  question: z.string().min(5).max(300),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional().default('EASY'),
  options: z.array(z.string().min(1)).min(3).max(4),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(5).max(400).default('Correct solution verification.'),
  format: z.enum(['mcq', 'short_answer', 'code', 'trace', 'reasoning']).optional().default('mcq'),
});

export const blueprintPracticeDrillSchema = z.object({
  conceptSlug: z.string().min(2).max(80),
  activityType: z.preprocess(
    (v) => (typeof v === 'string' ? v.toUpperCase() : v),
    z.enum(['EXPLAIN', 'PRACTICE', 'APPLY']).default('PRACTICE')
  ),
  activityTitle: z.string().min(2).max(120).default('Practice Drill'),
  activityDescription: z.string().min(5).max(400).default('Interactive exercise'),
  instructions: z.string().min(5).max(1000).default('Solve the problem to demonstrate mastery.'),
  durationMinutes: z.number().int().min(2).max(60).default(8),
  resources: z.array(curatedResourceSchema).default([]),
  questions: z.array(blueprintQuestionSchema).default([]),
  // Backward compatibility fields
  questionText: z.string().optional(),
  options: z.array(z.string().min(1)).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
});

export const candidateGoalBlueprintSchema = z.object({
  title: z.string().min(2).max(120).default('Personalized Learning Route'),
  description: z.string().min(5).max(500).default('Adaptive competency-based learning path'),
  subject: z.string().min(2).max(60).default('General'),
  baselineEstimatedActivities: z.number().int().min(3).max(100).default(20),
  concepts: z.array(candidateConceptNodeSchema).min(3).max(60),
  diagnosticQuestions: z.array(candidateDiagnosticQuestionSchema).min(3).max(25),
  practiceDrills: z.array(blueprintPracticeDrillSchema).min(3).max(60),
});

export type CandidateGoalBlueprint = z.infer<typeof candidateGoalBlueprintSchema>;
export type BlueprintPracticeDrill = z.infer<typeof blueprintPracticeDrillSchema>;
export type BlueprintQuestion = z.infer<typeof blueprintQuestionSchema>;
export type CuratedResourceCandidate = z.infer<typeof curatedResourceSchema>;

// ============================================================================
// 4. Candidate Misconception Schema
// ============================================================================
export const candidateMisconceptionSchema = z.object({
  isMisconception: z.boolean(),
  misconceptionTitle: z.string().min(3).max(120),
  diagnosis: z.string().min(10).max(500),
  errorType: z.enum(['conceptual', 'procedural', 'terminology', 'careless']),
  confidence: z.number().min(0.0).max(1.0),
  remediationTitle: z.string().min(5).max(120),
  remediationInstruction: z.string().min(20).max(1000),
  remediationThinkingPrompt: z.string().max(300).optional(),
});

export type CandidateMisconception = z.infer<typeof candidateMisconceptionSchema>;

// ============================================================================
// 5. Candidate Evidence Evaluation Schema
// ============================================================================
export const candidateEvidenceEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  meetsThreshold: z.boolean(),
  evaluationNotes: z.string().min(10).max(500),
  demonstratedStrengths: z.array(z.string()).default([]),
  identifiedGaps: z.array(z.string()).default([]),
});

export type CandidateEvidenceEvaluation = z.infer<typeof candidateEvidenceEvaluationSchema>;

// ============================================================================
// 6. Candidate Resource Ingestion Extraction Schema
// ============================================================================
export const candidateResourceExtractionSchema = z.object({
  title: z.string().min(3).max(150),
  summary: z.string().min(15).max(600),
  extractedConceptNames: z.array(z.string().min(2).max(80)).min(1),
  pedagogicalModality: z.enum(['visual', 'reading', 'practice', 'case_study']).default('reading'),
  estimatedReadMinutes: z.number().int().min(1).max(120).default(10),
});

export type CandidateResourceExtraction = z.infer<typeof candidateResourceExtractionSchema>;
