-- ============================================================================
-- GHOOMO MIGRATION 04: Production Compound Indexes & Curriculum Module Support
-- SIH 2026 Problem Statement 26207 Optimization
-- ============================================================================

-- 1. Add module_name to concepts for hierarchical curriculum organization
alter table public.concepts add column if not exists module_name text default 'Core Fundamentals';

-- 2. Performance Compound Indexes
-- learner_concept_state lookups by user and state
create index if not exists idx_learner_state_user_concept on public.learner_concept_state (user_id, concept_id);
create index if not exists idx_learner_state_user_state on public.learner_concept_state (user_id, state);

-- attempts lookups for sliding-window performance and activity history
create index if not exists idx_attempts_user_concept on public.attempts (user_id, concept_id);
create index if not exists idx_attempts_user_activity on public.attempts (user_id, activity_id);
create index if not exists idx_attempts_act_created on public.attempts (activity_id, created_at desc);

-- evidence lookups by user and journey
create index if not exists idx_evidence_user_concept on public.evidence (user_id, concept_id);
create index if not exists idx_evidence_journey_concept on public.evidence (journey_id, concept_id);

-- route_events temporal audit log lookups
create index if not exists idx_route_events_user_journey_created on public.route_events (user_id, journey_id, created_at desc);

-- learning_activities lookup by journey, concept, and pedagogical type
create index if not exists idx_activities_journey_concept_type on public.learning_activities (journey_id, concept_id, type);
