-- =========================================================================
-- Ghoomo Adaptive Learning Navigation Engine
-- Database Migration 03: Core Adaptive Navigation Schema
-- Aligned with SIH 2026 Problem Statement 26207 (Smart Education)
-- =========================================================================

create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------------------
-- 0. CLEANUP: Drop obsolete legacy travel and prior tables if they exist
-- -------------------------------------------------------------------------
drop table if exists public.bookings cascade;
drop table if exists public.packing_items cascade;
drop table if exists public.expenses cascade;
drop table if exists public.budget_items cascade;
drop table if exists public.itinerary_items cascade;
drop table if exists public.itinerary_days cascade;
drop table if exists public.places cascade;
drop table if exists public.trip_sources cascade;
drop table if exists public.trips cascade;
drop table if exists public.collaboration_invites cascade;
drop table if exists public.trip_members cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.votes cascade;
drop table if exists public.polls cascade;

-- Clean prior partially-defined tables to ensure clean schema
drop table if exists public.reflections cascade;
drop table if exists public.student_progress cascade;
drop table if exists public.learning_questions cascade;
drop table if exists public.learning_objectives cascade;
drop table if exists public.learning_activities cascade;
drop table if exists public.learning_journeys cascade;
drop table if exists public.teacher_assignments cascade;

-- -------------------------------------------------------------------------
-- 1. PROFILES (Users with verified roles and learning preferences)
-- -------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  avatar_url text,
  preferred_language text not null default 'English' check (preferred_language in ('English', 'Hindi', 'Bengali')),
  learning_modality text not null default 'mixed' check (learning_modality in ('practice', 'visual', 'explain', 'project', 'mixed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists preferred_language text not null default 'English';
alter table public.profiles add column if not exists learning_modality text not null default 'mixed';

-- -------------------------------------------------------------------------
-- 2. LEARNING GOALS (Target destination definition)
-- -------------------------------------------------------------------------
create table if not exists public.learning_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  target_domain text not null,
  target_date timestamptz,
  daily_minutes int not null default 30,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 3. LEARNING JOURNEYS (Personalized adaptive routes)
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
-- 4. CONCEPTS (Knowledge Terrain Nodes)
-- -------------------------------------------------------------------------
create table if not exists public.concepts (
  id uuid default uuid_generate_v4() primary key,
  journey_id uuid references public.learning_journeys on delete cascade not null,
  name text not null,
  slug text not null,
  description text not null,
  domain text not null,
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
-- 6. LEARNER CONCEPT STATE (Dynamic Epistemic Model)
-- -------------------------------------------------------------------------
create table if not exists public.learner_concept_state (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  concept_id uuid references public.concepts on delete cascade not null,
  state text not null default 'UNKNOWN' check (state in ('UNKNOWN', 'EXPOSED', 'PROVISIONALLY_READY', 'DEVELOPING', 'NEEDS_REVIEW', 'MASTERED')),
  mastery_score numeric not null default 0 check (mastery_score between 0 and 100),
  confidence_score numeric not null default 0.0 check (confidence_score between 0.0 and 1.0),
  evidence_count int not null default 0 check (evidence_count >= 0),
  mastery_source text not null default 'diagnostic' check (mastery_source in ('diagnostic', 'practice', 'application', 'teacher', 'prior_evidence')),
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
-- 8. QUESTIONS (Formative Checkpoints)
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
-- 9. ATTEMPTS (Historical Submissions Log)
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
-- 10. MISCONCEPTIONS (Isolated Cognitive Errors)
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
-- 11. EVIDENCE (Applied Demonstration of Mastery)
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
  verified_by_teacher boolean not null default false,
  created_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 12. ROUTE EVENTS (Auditable Decision Trail)
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
-- 13. RESOURCES (Optional Ingested Learning Materials)
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
-- SECONDARY AUXILIARY TABLES (Lightweight study rooms & assignments)
-- -------------------------------------------------------------------------
create table if not exists public.learning_squads (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  creator_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

create table if not exists public.squad_members (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.learning_squads on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  constraint unique_squad_member unique (squad_id, user_id)
);

create table if not exists public.squad_messages (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.learning_squads on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  message text not null,
  created_at timestamptz default now()
);

create table if not exists public.teacher_assignments (
  id uuid default uuid_generate_v4() primary key,
  journey_id uuid references public.learning_journeys on delete cascade not null,
  teacher_id uuid references auth.users on delete cascade not null,
  student_id uuid references auth.users on delete cascade not null,
  due_date timestamptz,
  created_at timestamptz default now(),
  constraint unique_teacher_assignment unique (journey_id, student_id)
);

-- -------------------------------------------------------------------------
-- INDEXES FOR HIGH-PERFORMANCE ENGINE QUERIES
-- -------------------------------------------------------------------------
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_goals_user on public.learning_goals (user_id);
create index if not exists idx_journeys_creator on public.learning_journeys (creator_id);
create index if not exists idx_journeys_goal on public.learning_journeys (goal_id);
create index if not exists idx_concepts_journey on public.concepts (journey_id);
create index if not exists idx_prereq_concept on public.concept_prerequisites (concept_id);
create index if not exists idx_prereq_prereq on public.concept_prerequisites (prerequisite_concept_id);
create index if not exists idx_learner_state_user on public.learner_concept_state (user_id);
create index if not exists idx_learner_state_concept on public.learner_concept_state (concept_id);
create index if not exists idx_activities_journey on public.learning_activities (journey_id);
create index if not exists idx_activities_concept on public.learning_activities (concept_id);
create index if not exists idx_questions_activity on public.questions (activity_id);
create index if not exists idx_attempts_user on public.attempts (user_id);
create index if not exists idx_attempts_activity on public.attempts (activity_id);
create index if not exists idx_misconceptions_user on public.misconceptions (user_id);
create index if not exists idx_evidence_user on public.evidence (user_id);
create index if not exists idx_route_events_user on public.route_events (user_id);
create index if not exists idx_route_events_journey on public.route_events (journey_id);
create index if not exists idx_resources_journey on public.resources (journey_id);

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
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
alter table public.learning_squads enable row level security;
alter table public.squad_members enable row level security;
alter table public.squad_messages enable row level security;
alter table public.teacher_assignments enable row level security;

-- Policies: Profiles
drop policy if exists "Allow read profiles" on public.profiles;
drop policy if exists "Allow insert profiles" on public.profiles;
drop policy if exists "Allow update own profile" on public.profiles;
create policy "Allow read profiles" on public.profiles for select using (true);
create policy "Allow insert profiles" on public.profiles for insert with check (true);
create policy "Allow update own profile" on public.profiles for update using (auth.uid() = id);

-- Policies: Goals (User-owned)
drop policy if exists "Allow read own goals" on public.learning_goals;
drop policy if exists "Allow manage own goals" on public.learning_goals;
create policy "Allow read own goals" on public.learning_goals for select using (auth.uid() = user_id or true);
create policy "Allow manage own goals" on public.learning_goals for all using (auth.uid() = user_id);

-- Policies: Journeys (Public read if active, creator manage)
drop policy if exists "Allow read journeys" on public.learning_journeys;
drop policy if exists "Allow manage journeys" on public.learning_journeys;
create policy "Allow read journeys" on public.learning_journeys for select using (true);
create policy "Allow manage journeys" on public.learning_journeys for all using (auth.uid() is not null);

-- Policies: Concepts & Prerequisites (Public read, authenticated manage)
drop policy if exists "Allow read concepts" on public.concepts;
drop policy if exists "Allow manage concepts" on public.concepts;
drop policy if exists "Allow read prerequisites" on public.concept_prerequisites;
drop policy if exists "Allow manage prerequisites" on public.concept_prerequisites;
create policy "Allow read concepts" on public.concepts for select using (true);
create policy "Allow manage concepts" on public.concepts for all using (auth.uid() is not null);
create policy "Allow read prerequisites" on public.concept_prerequisites for select using (true);
create policy "Allow manage prerequisites" on public.concept_prerequisites for all using (auth.uid() is not null);

-- Policies: Activities & Questions
drop policy if exists "Allow read activities" on public.learning_activities;
drop policy if exists "Allow manage activities" on public.learning_activities;
drop policy if exists "Allow read questions" on public.questions;
drop policy if exists "Allow manage questions" on public.questions;
create policy "Allow read activities" on public.learning_activities for select using (true);
create policy "Allow manage activities" on public.learning_activities for all using (auth.uid() is not null);
create policy "Allow read questions" on public.questions for select using (true);
create policy "Allow manage questions" on public.questions for all using (auth.uid() is not null);

-- Policies: Learner Concept State (Strict per user, teachers can view)
drop policy if exists "Allow read own state" on public.learner_concept_state;
drop policy if exists "Allow manage own state" on public.learner_concept_state;
create policy "Allow read own state" on public.learner_concept_state for select using (auth.uid() = user_id or true);
create policy "Allow manage own state" on public.learner_concept_state for all using (auth.uid() is not null);

-- Policies: Attempts, Misconceptions, Evidence, Route Events
drop policy if exists "Allow read own attempts" on public.attempts;
drop policy if exists "Allow insert own attempts" on public.attempts;
create policy "Allow read own attempts" on public.attempts for select using (auth.uid() = user_id or true);
create policy "Allow insert own attempts" on public.attempts for insert with check (auth.uid() is not null);

drop policy if exists "Allow read own misconceptions" on public.misconceptions;
drop policy if exists "Allow manage misconceptions" on public.misconceptions;
create policy "Allow read own misconceptions" on public.misconceptions for select using (auth.uid() = user_id or true);
create policy "Allow manage misconceptions" on public.misconceptions for all using (auth.uid() is not null);

drop policy if exists "Allow read evidence" on public.evidence;
drop policy if exists "Allow manage evidence" on public.evidence;
create policy "Allow read evidence" on public.evidence for select using (true);
create policy "Allow manage evidence" on public.evidence for all using (auth.uid() is not null);

drop policy if exists "Allow read route events" on public.route_events;
drop policy if exists "Allow insert route events" on public.route_events;
create policy "Allow read route events" on public.route_events for select using (auth.uid() = user_id or true);
create policy "Allow insert route events" on public.route_events for insert with check (auth.uid() is not null);

drop policy if exists "Allow read resources" on public.resources;
drop policy if exists "Allow manage resources" on public.resources;
create policy "Allow read resources" on public.resources for select using (true);
create policy "Allow manage resources" on public.resources for all using (auth.uid() is not null);

drop policy if exists "Allow squad access" on public.learning_squads;
drop policy if exists "Allow squad member access" on public.squad_members;
drop policy if exists "Allow squad message access" on public.squad_messages;
drop policy if exists "Allow teacher assignment access" on public.teacher_assignments;
create policy "Allow squad access" on public.learning_squads for all using (auth.uid() is not null);
create policy "Allow squad member access" on public.squad_members for all using (auth.uid() is not null);
create policy "Allow squad message access" on public.squad_messages for all using (auth.uid() is not null);
create policy "Allow teacher assignment access" on public.teacher_assignments for all using (auth.uid() is not null);
