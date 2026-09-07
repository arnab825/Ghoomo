-- ============================================================================
-- Ghoomo Adaptive Learning Navigation Engine
-- Migration 05: Complete Removal of Teacher Architecture & Tables
-- ============================================================================

-- 1. Drop teacher_assignments table and all associated indexes/policies
drop table if exists public.teacher_assignments cascade;

-- 2. Update profiles check constraint to remove teacher
alter table public.profiles
  drop constraint if exists profiles_role_check;

-- 3. Migrate any existing teacher profiles to learner role
update public.profiles
set role = 'learner'
where role = 'teacher';

alter table public.profiles
  add constraint profiles_role_check check (role in ('learner', 'student', 'admin'));

-- 4. Update evidence table: rename or add verified column
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'evidence'
      and column_name = 'verified_by_teacher'
  ) then
    alter table public.evidence rename column verified_by_teacher to verified;
  end if;
end $$;

-- 5. Update learner_concept_state mastery_source constraint to remove 'teacher'
update public.learner_concept_state
set mastery_source = 'practice'
where mastery_source = 'teacher';

alter table public.learner_concept_state
  drop constraint if exists learner_concept_state_mastery_source_check;

alter table public.learner_concept_state
  add constraint learner_concept_state_mastery_source_check
  check (mastery_source in ('diagnostic', 'practice', 'application', 'prior_evidence'));
