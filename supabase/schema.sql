-- =========================================================================
-- Ghoomo Adaptive Learning Navigation Engine - Canonical Database Schema
-- Aligned with SIH 2026 Problem Statement 26207 (Smart Education)
-- Reflects migrations 01 through 09: Learner-First, Deterministic Mastery,
-- Zero-Mock AI Ingestion, Full Row-Level Security, and Spaced Reviews.
-- =========================================================================

create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. PROFILES (Learners & Admins)
-- -------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null default 'learner' check (role in ('learner', 'student', 'admin')),
  avatar_url text,
  credits int default 9 check (credits >= 0),
  preferred_language text not null default 'English' check (preferred_language in ('English', 'Hindi', 'Bengali')),
  learning_modality text not null default 'mixed' check (learning_modality in ('interactive', 'practice', 'visual', 'explain', 'project', 'mixed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 2. LEARNING GOALS (Target Destination Definitions)
-- -------------------------------------------------------------------------
create table if not exists public.learning_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  target_domain text not null,
  target_date timestamptz,
  daily_minutes int not null default 30 check (daily_minutes between 5 and 180),
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 3. LEARNING JOURNEYS (Personalized Adaptive Knowledge Curricula)
-- -------------------------------------------------------------------------
create table if not exists public.learning_journeys (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references auth.users on delete cascade not null,
  goal_id uuid references public.learning_goals on delete cascade not null,
  title text not null,
  description text not null,
  subject text not null,
  difficulty text not null default 'intermediate' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  status text not null default 'active' check (status in ('active', 'archived')),
  baseline_activity_count int not null default 0,
  readiness_score numeric not null default 0 check (readiness_score between 0 and 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 4. CONCEPTS (Knowledge Terrain Nodes / Knowledge Graph)
-- -------------------------------------------------------------------------
create table if not exists public.concepts (
  id uuid default uuid_generate_v4() primary key,
  journey_id uuid references public.learning_journeys on delete cascade not null,
  name text not null,
  slug text not null,
  description text not null,
  domain text not null,
  module_name text not null default 'Core',
  difficulty text not null default 'intermediate',
  mastery_threshold int not null default 80 check (mastery_threshold between 50 and 100),
  order_index int not null default 0,
  created_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 5. CONCEPT PREREQUISITES (Strict Verified DAG Edges)
-- -------------------------------------------------------------------------
create table if not exists public.concept_prerequisites (
  id uuid default uuid_generate_v4() primary key,
  concept_id uuid references public.concepts on delete cascade not null,
  prerequisite_concept_id uuid references public.concepts on delete cascade not null,
  created_at timestamptz default now(),
  constraint unique_prerequisite_pair unique (concept_id, prerequisite_concept_id),
  constraint no_self_prerequisite check (concept_id <> prerequisite_concept_id)
);

-- -------------------------------------------------------------------------
-- 6. LEARNER CONCEPT STATE (Dynamic Epistemic Mastery Ledger)
-- -------------------------------------------------------------------------
create table if not exists public.learner_concept_state (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  concept_id uuid references public.concepts on delete cascade not null,
  state text not null default 'UNKNOWN' check (state in ('UNKNOWN', 'EXPOSED', 'PROVISIONALLY_READY', 'DEVELOPING', 'NEEDS_REVIEW', 'MASTERED')),
  mastery_score numeric not null default 0 check (mastery_score between 0 and 100),
  confidence_score numeric not null default 0.0 check (confidence_score between 0.0 and 1.0),
  evidence_count int not null default 0 check (evidence_count >= 0),
  mastery_source text not null default 'diagnostic' check (mastery_source in ('diagnostic', 'practice', 'application', 'prior_evidence')),
  evidence_summary text,
  last_assessed_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_concept_state unique (user_id, concept_id)
);

-- -------------------------------------------------------------------------
-- 7. LEARNING ACTIVITIES (Atomic Pedagogical Tasks)
-- -------------------------------------------------------------------------
create table if not exists public.learning_activities (
  id uuid default uuid_generate_v4() primary key,
  journey_id uuid references public.learning_journeys on delete cascade not null,
  concept_id uuid references public.concepts on delete cascade not null,
  type text not null check (type in ('DIAGNOSE', 'EXPLAIN', 'PRACTICE', 'APPLY', 'REMEDIATE', 'PROVE', 'REFLECT')),
  title text not null,
  description text not null,
  instructions text,
  thinking_prompt text,
  hints jsonb default '[]'::jsonb,
  duration_minutes int not null default 10 check (duration_minutes between 1 and 180),
  is_remediation boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 8. QUESTIONS (Formative & Diagnostic Checkpoints)
-- -------------------------------------------------------------------------
create table if not exists public.questions (
  id uuid default uuid_generate_v4() primary key,
  activity_id uuid references public.learning_activities on delete cascade not null,
  concept_id uuid references public.concepts on delete cascade not null,
  question text not null,
  question_type text not null default 'mcq' check (question_type in ('mcq', 'open_ended')),
  options jsonb default '[]'::jsonb,
  correct_answer text not null,
  explanation text,
  order_index int not null default 0,
  created_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 9. ATTEMPTS (Historical Submissions & Telemetry)
-- -------------------------------------------------------------------------
create table if not exists public.attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  activity_id uuid references public.learning_activities on delete cascade not null,
  question_id uuid references public.questions on delete cascade,
  concept_id uuid references public.concepts on delete cascade not null,
  submitted_answer text not null,
  is_correct boolean not null,
  confidence_score numeric not null default 0.8 check (confidence_score between 0.0 and 1.0),
  score numeric not null default 0 check (score between 0 and 100),
  rationale text,
  time_spent_seconds int not null default 0,
  created_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 10. MISCONCEPTIONS (Cognitive Error Detections & Remediation)
-- -------------------------------------------------------------------------
create table if not exists public.misconceptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  concept_id uuid references public.concepts on delete cascade not null,
  activity_id uuid references public.learning_activities on delete cascade not null,
  attempt_id uuid references public.attempts on delete cascade,
  misconception_title text not null,
  diagnosis text not null,
  confidence numeric not null default 0.85 check (confidence between 0.0 and 1.0),
  remediation_activity_id uuid references public.learning_activities on delete set null,
  is_resolved boolean not null default false,
  created_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 11. EVIDENCE (Demonstrated Proof of Mastery)
-- -------------------------------------------------------------------------
create table if not exists public.evidence (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  journey_id uuid references public.learning_journeys on delete cascade not null,
  concept_id uuid references public.concepts on delete cascade not null,
  activity_id uuid references public.learning_activities on delete cascade not null,
  evidence_type text not null check (evidence_type in ('text', 'image', 'link', 'code')),
  content text not null,
  ai_evaluation text,
  verified boolean not null default false,
  created_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 12. ROUTE EVENTS (Auditable Navigation Trail)
-- -------------------------------------------------------------------------
create table if not exists public.route_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  journey_id uuid references public.learning_journeys on delete cascade not null,
  trigger_concept_id uuid references public.concepts on delete set null,
  event_type text not null check (event_type in ('DIAGNOSTIC_SKIPPED', 'PREREQUISITE_INSERTED', 'MISCONCEPTION_REROUTE', 'MASTERY_UNLOCKED', 'REMEDIATION_CLEARED')),
  reason text not null,
  evidence_summary text,
  previous_action text,
  new_action text,
  created_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 13. RESOURCES (Ingested Documents & External Context)
-- -------------------------------------------------------------------------
create table if not exists public.resources (
  id uuid default uuid_generate_v4() primary key,
  journey_id uuid references public.learning_journeys on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  url text,
  title text not null,
  resource_type text not null check (resource_type in ('text', 'url', 'pdf', 'youtube')),
  raw_content text,
  extracted_concepts jsonb default '[]'::jsonb,
  gap_mappings jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 14. AI ARTIFACTS CACHE (Multi-Layered Deterministic L2 AI Cache)
-- -------------------------------------------------------------------------
create table if not exists public.ai_artifacts (
  id uuid default uuid_generate_v4() primary key,
  artifact_type text not null check (artifact_type in (
    'roadmap', 'content', 'diagnostic', 'misconception',
    'evidence_eval', 'resource_extract', 'challenge', 'rich_content'
  )),
  input_hash text not null,
  model text not null default 'unknown',
  prompt_version text not null default 'v1',
  response_json jsonb not null,
  token_estimate int default 0,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 days'),
  constraint unique_artifact_hash unique (artifact_type, input_hash, prompt_version)
);

-- -------------------------------------------------------------------------
-- 15. REVIEW SCHEDULE (Spaced Repetition Engine / SM-2)
-- -------------------------------------------------------------------------
create table if not exists public.review_schedule (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  concept_id uuid references public.concepts on delete cascade not null,
  next_review_at timestamptz not null default now(),
  interval_days int not null default 1 check (interval_days >= 1),
  ease_factor numeric not null default 2.5 check (ease_factor >= 1.3),
  review_count int not null default 0 check (review_count >= 0),
  last_result text check (last_result in ('success', 'failure', 'skip')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_concept_review unique (user_id, concept_id)
);

-- -------------------------------------------------------------------------
-- 16. MASTERY POLICIES (Configurable Progression Rules)
-- -------------------------------------------------------------------------
create table if not exists public.mastery_policies (
  id uuid default uuid_generate_v4() primary key,
  concept_id uuid references public.concepts on delete cascade,
  domain text,
  required_evidence_types jsonb not null default '["practice"]'::jsonb,
  minimum_score int not null default 85 check (minimum_score between 50 and 100),
  minimum_confidence numeric not null default 0.85 check (minimum_confidence between 0.0 and 1.0),
  minimum_distinct_evidence int not null default 2 check (minimum_distinct_evidence >= 1),
  created_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 17. RESOURCE ITEMS (Curated & Realtime Live-Ranked Topic Resources)
-- -------------------------------------------------------------------------
create table if not exists public.resource_items (
  id uuid default uuid_generate_v4() primary key,
  concept_id uuid references public.concepts on delete cascade not null,
  url text not null,
  title text not null,
  resource_type text not null check (resource_type in (
    'docs', 'article', 'video', 'book', 'practice', 'interactive'
  )),
  platform text not null default 'Web',
  quality_score numeric default 0.8 check (quality_score between 0.0 and 1.0),
  duration_minutes int,
  validated boolean not null default false,
  created_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- INDEXES FOR HIGH-THROUGHPUT ADAPTIVE NAVIGATION
-- -------------------------------------------------------------------------
create index if not exists idx_concepts_journey_id on public.concepts(journey_id);
create index if not exists idx_concepts_slug on public.concepts(slug);
create index if not exists idx_concept_prereq_concept on public.concept_prerequisites(concept_id);
create index if not exists idx_concept_prereq_prereq on public.concept_prerequisites(prerequisite_concept_id);
create index if not exists idx_learner_state_user on public.learner_concept_state(user_id);
create index if not exists idx_learner_state_concept on public.learner_concept_state(concept_id);
create index if not exists idx_learner_state_composite on public.learner_concept_state(user_id, concept_id, state);
create index if not exists idx_activities_journey on public.learning_activities(journey_id);
create index if not exists idx_activities_concept on public.learning_activities(concept_id);
create index if not exists idx_questions_activity on public.questions(activity_id);
create index if not exists idx_questions_concept on public.questions(concept_id);
create index if not exists idx_attempts_user on public.attempts(user_id);
create index if not exists idx_attempts_concept on public.attempts(concept_id);
create index if not exists idx_misconceptions_user on public.misconceptions(user_id);
create index if not exists idx_misconceptions_concept on public.misconceptions(concept_id);
create index if not exists idx_evidence_user on public.evidence(user_id);
create index if not exists idx_evidence_concept on public.evidence(concept_id);
create index if not exists idx_route_events_user on public.route_events(user_id);
create index if not exists idx_route_events_journey on public.route_events(journey_id);
create index if not exists idx_ai_artifacts_hash on public.ai_artifacts(artifact_type, input_hash);
create index if not exists idx_ai_artifacts_expires on public.ai_artifacts(expires_at);
create index if not exists idx_review_schedule_user_next on public.review_schedule(user_id, next_review_at);
create index if not exists idx_resource_items_concept on public.resource_items(concept_id);
create index if not exists idx_mastery_policies_concept on public.mastery_policies(concept_id);

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (Strict User Isolation + Admin Oversight)
-- -------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.learning_goals enable row level security;
alter table public.learning_journeys enable row level security;
alter table public.concepts enable row level security;
alter table public.concept_prerequisites enable row level security;
alter table public.learner_concept_state enable row level security;
alter table public.learning_activities enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.misconceptions enable row level security;
alter table public.evidence enable row level security;
alter table public.route_events enable row level security;
alter table public.resources enable row level security;
alter table public.ai_artifacts enable row level security;
alter table public.review_schedule enable row level security;
alter table public.mastery_policies enable row level security;
alter table public.resource_items enable row level security;
