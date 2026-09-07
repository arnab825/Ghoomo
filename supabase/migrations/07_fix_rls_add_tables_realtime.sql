-- ============================================================================
-- Ghoomo Adaptive Learning Navigation Engine
-- Migration 07: Fix RLS + New Tables + Full Realtime
-- ============================================================================

-- =========================================================================
-- SECTION 1: FIX CRITICAL RLS VULNERABILITY
-- Remove all "or true" policies that expose user data to other users
-- =========================================================================

-- 1a. Learner Concept State — STRICT user isolation
DROP POLICY IF EXISTS "Allow read own state" ON public.learner_concept_state;
DROP POLICY IF EXISTS "Allow manage own state" ON public.learner_concept_state;
CREATE POLICY "learner_state_select_own" ON public.learner_concept_state
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "learner_state_insert_own" ON public.learner_concept_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "learner_state_update_own" ON public.learner_concept_state
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "learner_state_delete_own" ON public.learner_concept_state
  FOR DELETE USING (auth.uid() = user_id);
-- Admin can read all learner states
CREATE POLICY "learner_state_admin_read" ON public.learner_concept_state
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 1b. Attempts — STRICT user isolation
DROP POLICY IF EXISTS "Allow read own attempts" ON public.attempts;
DROP POLICY IF EXISTS "Allow insert own attempts" ON public.attempts;
CREATE POLICY "attempts_select_own" ON public.attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "attempts_insert_own" ON public.attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attempts_admin_read" ON public.attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 1c. Misconceptions — STRICT user isolation
DROP POLICY IF EXISTS "Allow read own misconceptions" ON public.misconceptions;
DROP POLICY IF EXISTS "Allow manage misconceptions" ON public.misconceptions;
CREATE POLICY "misconceptions_select_own" ON public.misconceptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "misconceptions_insert_own" ON public.misconceptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "misconceptions_update_own" ON public.misconceptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "misconceptions_admin_read" ON public.misconceptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 1d. Evidence — STRICT user isolation
DROP POLICY IF EXISTS "Allow read evidence" ON public.evidence;
DROP POLICY IF EXISTS "Allow manage evidence" ON public.evidence;
CREATE POLICY "evidence_select_own" ON public.evidence
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "evidence_insert_own" ON public.evidence
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "evidence_update_own" ON public.evidence
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "evidence_admin_read" ON public.evidence
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 1e. Route Events — STRICT user isolation
DROP POLICY IF EXISTS "Allow read route events" ON public.route_events;
DROP POLICY IF EXISTS "Allow insert route events" ON public.route_events;
CREATE POLICY "route_events_select_own" ON public.route_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "route_events_insert_own" ON public.route_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "route_events_admin_read" ON public.route_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 1f. Learning Goals — user owns their goals, admin can read all
DROP POLICY IF EXISTS "Allow read own goals" ON public.learning_goals;
DROP POLICY IF EXISTS "Allow manage own goals" ON public.learning_goals;
CREATE POLICY "goals_select_own" ON public.learning_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert_own" ON public.learning_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update_own" ON public.learning_goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goals_delete_own" ON public.learning_goals
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "goals_admin_read" ON public.learning_goals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 1g. Learning Journeys — creator owns, authenticated can read (shared curricula)
DROP POLICY IF EXISTS "Allow read journeys" ON public.learning_journeys;
DROP POLICY IF EXISTS "Allow manage journeys" ON public.learning_journeys;
CREATE POLICY "journeys_select_own" ON public.learning_journeys
  FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "journeys_insert_own" ON public.learning_journeys
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "journeys_update_own" ON public.learning_journeys
  FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "journeys_delete_own" ON public.learning_journeys
  FOR DELETE USING (auth.uid() = creator_id);
CREATE POLICY "journeys_admin_read" ON public.learning_journeys
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 1h. Concepts — journey creator manages, authenticated can read
DROP POLICY IF EXISTS "Allow read concepts" ON public.concepts;
DROP POLICY IF EXISTS "Allow manage concepts" ON public.concepts;
CREATE POLICY "concepts_select" ON public.concepts
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "concepts_manage" ON public.concepts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.learning_journeys WHERE id = concepts.journey_id AND creator_id = auth.uid())
  );

-- 1i. Concept Prerequisites — same as concepts
DROP POLICY IF EXISTS "Allow read prerequisites" ON public.concept_prerequisites;
DROP POLICY IF EXISTS "Allow manage prerequisites" ON public.concept_prerequisites;
CREATE POLICY "prereqs_select" ON public.concept_prerequisites
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "prereqs_manage" ON public.concept_prerequisites
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 1j. Activities & Questions — authenticated read, journey creator manages
DROP POLICY IF EXISTS "Allow read activities" ON public.learning_activities;
DROP POLICY IF EXISTS "Allow manage activities" ON public.learning_activities;
DROP POLICY IF EXISTS "Allow read questions" ON public.questions;
DROP POLICY IF EXISTS "Allow manage questions" ON public.questions;
CREATE POLICY "activities_select" ON public.learning_activities
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "activities_manage" ON public.learning_activities
  FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "questions_select" ON public.questions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "questions_manage" ON public.questions
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 1k. Profiles — own profile update, admin reads all
DROP POLICY IF EXISTS "Allow read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profiles" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_read" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 1l. Resources — authenticated read, owner manages
DROP POLICY IF EXISTS "Allow read resources" ON public.resources;
DROP POLICY IF EXISTS "Allow manage resources" ON public.resources;
CREATE POLICY "resources_select" ON public.resources
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "resources_manage" ON public.resources
  FOR ALL USING (auth.uid() = user_id);

-- =========================================================================
-- SECTION 2: NEW TABLES FOR ADAPTIVE ENGINE
-- =========================================================================

-- 2a. AI Artifacts Cache (persistent across restarts)
CREATE TABLE IF NOT EXISTS public.ai_artifacts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  artifact_type text NOT NULL CHECK (artifact_type IN (
    'roadmap', 'content', 'diagnostic', 'misconception',
    'evidence_eval', 'resource_extract', 'challenge', 'rich_content'
  )),
  input_hash text NOT NULL,
  model text NOT NULL DEFAULT 'unknown',
  prompt_version text NOT NULL DEFAULT 'v1',
  response_json jsonb NOT NULL,
  token_estimate int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  CONSTRAINT unique_artifact_hash UNIQUE (artifact_type, input_hash, prompt_version)
);

-- 2b. Spaced Review Schedule
CREATE TABLE IF NOT EXISTS public.review_schedule (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  concept_id uuid REFERENCES public.concepts ON DELETE CASCADE NOT NULL,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  interval_days int NOT NULL DEFAULT 1 CHECK (interval_days >= 1),
  ease_factor numeric NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3),
  review_count int NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  last_result text CHECK (last_result IN ('success', 'failure', 'skip')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_concept_review UNIQUE (user_id, concept_id)
);

-- 2c. Mastery Policies (concept-specific or domain-level defaults)
CREATE TABLE IF NOT EXISTS public.mastery_policies (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  concept_id uuid REFERENCES public.concepts ON DELETE CASCADE,
  domain text,
  required_evidence_types jsonb NOT NULL DEFAULT '["practice"]'::jsonb,
  minimum_score int NOT NULL DEFAULT 85 CHECK (minimum_score BETWEEN 50 AND 100),
  minimum_confidence numeric NOT NULL DEFAULT 0.85 CHECK (minimum_confidence BETWEEN 0.0 AND 1.0),
  minimum_distinct_evidence int NOT NULL DEFAULT 2 CHECK (minimum_distinct_evidence >= 1),
  created_at timestamptz DEFAULT now()
);

-- 2d. Structured Resource Items (concept-mapped, validated)
CREATE TABLE IF NOT EXISTS public.resource_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  concept_id uuid REFERENCES public.concepts ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN (
    'docs', 'article', 'video', 'book', 'practice', 'interactive'
  )),
  platform text NOT NULL DEFAULT 'Web',
  quality_score numeric DEFAULT 0.8 CHECK (quality_score BETWEEN 0.0 AND 1.0),
  duration_minutes int,
  validated boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =========================================================================
-- SECTION 3: INDEXES FOR NEW TABLES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_ai_artifacts_hash ON public.ai_artifacts (artifact_type, input_hash);
CREATE INDEX IF NOT EXISTS idx_ai_artifacts_expires ON public.ai_artifacts (expires_at);
CREATE INDEX IF NOT EXISTS idx_review_schedule_user ON public.review_schedule (user_id);
CREATE INDEX IF NOT EXISTS idx_review_schedule_next ON public.review_schedule (next_review_at);
CREATE INDEX IF NOT EXISTS idx_review_schedule_user_next ON public.review_schedule (user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_resource_items_concept ON public.resource_items (concept_id);
CREATE INDEX IF NOT EXISTS idx_mastery_policies_concept ON public.mastery_policies (concept_id);
CREATE INDEX IF NOT EXISTS idx_mastery_policies_domain ON public.mastery_policies (domain);

-- =========================================================================
-- SECTION 4: RLS FOR NEW TABLES
-- =========================================================================
ALTER TABLE public.ai_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_items ENABLE ROW LEVEL SECURITY;

-- AI artifacts: globally readable cache, authenticated insert
CREATE POLICY "ai_artifacts_read" ON public.ai_artifacts FOR SELECT USING (true);
CREATE POLICY "ai_artifacts_insert" ON public.ai_artifacts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Review schedule: user owns their schedule
CREATE POLICY "review_schedule_own" ON public.review_schedule FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "review_schedule_admin" ON public.review_schedule
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Mastery policies: globally readable, admin manages
CREATE POLICY "mastery_policies_read" ON public.mastery_policies FOR SELECT USING (true);
CREATE POLICY "mastery_policies_admin" ON public.mastery_policies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Resource items: globally readable, authenticated insert
CREATE POLICY "resource_items_read" ON public.resource_items FOR SELECT USING (true);
CREATE POLICY "resource_items_insert" ON public.resource_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =========================================================================
-- SECTION 5: REALTIME ON ALL TABLES (INCLUDING NEW)
-- =========================================================================
ALTER TABLE public.ai_artifacts REPLICA IDENTITY FULL;
ALTER TABLE public.review_schedule REPLICA IDENTITY FULL;
ALTER TABLE public.mastery_policies REPLICA IDENTITY FULL;
ALTER TABLE public.resource_items REPLICA IDENTITY FULL;

DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'ai_artifacts',
    'review_schedule',
    'mastery_policies',
    'resource_items'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
    END IF;
  END LOOP;
END $$;

-- =========================================================================
-- SECTION 6: CREATE ATTEMPTS VIEW (backward compat alias)
-- The dashboard uses 'learner_attempts' but the table is 'attempts'
-- =========================================================================
CREATE OR REPLACE VIEW public.learner_attempts AS
  SELECT * FROM public.attempts;
