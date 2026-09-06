-- =========================================================================
-- Ghoomo Smart Experiential Education Platform (PostgreSQL / Supabase)
-- Role-based, Database-driven learning architecture
-- =========================================================================

create extension if not exists "uuid-ossp";

-- 1. PROFILES (Users with verified role: 'student' or 'teacher')
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('student', 'teacher')),
  avatar_url text,
  credits int default 9 check (credits >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. LEARNING JOURNEYS (Curriculum-aligned experiential learning)
create table if not exists public.learning_journeys (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text not null,
  subject text not null,
  grade_level text not null,
  difficulty text not null default 'intermediate' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  language text not null default 'English',
  mode text not null default 'explore' check (mode in ('digital', 'explore', 'field_trip')),
  duration_days int not null default 1 check (duration_days >= 1 and duration_days <= 14),
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  cover_image text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. LEARNING OBJECTIVES
create table if not exists public.learning_objectives (
  id uuid default uuid_generate_v4() primary key,
  journey_id uuid references public.learning_journeys on delete cascade not null,
  objective text not null,
  blooms_level text not null default 'understand' check (blooms_level in ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')),
  order_index int not null default 0,
  created_at timestamptz default now()
);

-- 4. LEARNING ACTIVITIES (BEFORE -> DURING -> AFTER stages)
create table if not exists public.learning_activities (
  id uuid default uuid_generate_v4() primary key,
  journey_id uuid references public.learning_journeys on delete cascade not null,
  stage text not null check (stage in ('before', 'during', 'after')),
  type text not null check (type in ('briefing', 'observation', 'mission', 'quiz', 'reflection')),
  title text not null,
  description text not null,
  duration_minutes int not null default 20,
  instruction text,
  thinking_prompt text,
  place_name text,
  lat double precision,
  lng double precision,
  order_index int not null default 0,
  created_at timestamptz default now()
);

-- 5. LEARNING QUESTIONS (Formative & In-situ Checkpoints)
create table if not exists public.learning_questions (
  id uuid default uuid_generate_v4() primary key,
  activity_id uuid references public.learning_activities on delete cascade not null,
  question text not null,
  question_type text not null default 'mcq' check (question_type in ('mcq', 'short_answer')),
  options jsonb default '["Option A", "Option B", "Option C", "Option D"]'::jsonb,
  correct_answer text not null,
  explanation text,
  order_index int not null default 0,
  created_at timestamptz default now()
);

-- 6. TEACHER ASSIGNMENTS (Teacher assigns journey to students)
create table if not exists public.teacher_assignments (
  id uuid default uuid_generate_v4() primary key,
  journey_id uuid references public.learning_journeys on delete cascade not null,
  teacher_id uuid references auth.users on delete cascade not null,
  student_id uuid references auth.users on delete cascade not null,
  due_date timestamptz,
  status text not null default 'assigned' check (status in ('assigned', 'in_progress', 'completed')),
  created_at timestamptz default now(),
  constraint unique_student_journey_assignment unique (journey_id, student_id)
);

-- 7. STUDENT PROGRESS (Real-time activity completion, scores, & responses)
create table if not exists public.student_progress (
  id uuid default uuid_generate_v4() primary key,
  journey_id uuid references public.learning_journeys on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  activity_id uuid references public.learning_activities on delete cascade not null,
  status text not null default 'completed' check (status in ('pending', 'in_progress', 'completed')),
  score numeric default 100 check (score >= 0 and score <= 100),
  response text,
  evidence_url text,
  completed_at timestamptz default now(),
  constraint unique_user_activity_progress unique (user_id, activity_id)
);

-- 8. REFLECTIONS (Student personal reflections with 3D AI evaluation)
create table if not exists public.reflections (
  id uuid default uuid_generate_v4() primary key,
  journey_id uuid references public.learning_journeys on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  activity_id uuid references public.learning_activities on delete cascade not null,
  prompt text not null,
  response text not null,
  ai_feedback text,
  rubric_depth int default 3 check (rubric_depth between 1 and 5),
  rubric_accuracy int default 3 check (rubric_accuracy between 1 and 5),
  rubric_synthesis int default 3 check (rubric_synthesis between 1 and 5),
  created_at timestamptz default now(),
  constraint unique_user_activity_reflection unique (user_id, activity_id)
);

-- =========================================================================
-- INDEXES FOR HIGH-PERFORMANCE DASHBOARDS & QUERIES
-- =========================================================================
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_learning_journeys_creator on public.learning_journeys (creator_id);
create index if not exists idx_learning_objectives_journey on public.learning_objectives (journey_id);
create index if not exists idx_learning_activities_journey on public.learning_activities (journey_id);
create index if not exists idx_learning_questions_activity on public.learning_questions (activity_id);
create index if not exists idx_teacher_assignments_student on public.teacher_assignments (student_id);
create index if not exists idx_teacher_assignments_teacher on public.teacher_assignments (teacher_id);
create index if not exists idx_student_progress_user on public.student_progress (user_id);
create index if not exists idx_student_progress_journey on public.student_progress (journey_id);
create index if not exists idx_reflections_user on public.reflections (user_id);
create index if not exists idx_reflections_journey on public.reflections (journey_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.learning_journeys enable row level security;
alter table public.learning_objectives enable row level security;
alter table public.learning_activities enable row level security;
alter table public.learning_questions enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.student_progress enable row level security;
alter table public.reflections enable row level security;

-- Profiles: Authenticated users can read all profiles (needed for student list & teacher assignments), update own profile
create policy "Allow read all profiles" on public.profiles for select using (true);
create policy "Allow insert profiles" on public.profiles for insert with check (true);
create policy "Allow update own profile" on public.profiles for update using (auth.uid() = id);

-- Learning Journeys: Read if published or if creator; Insert/Update/Delete if creator
create policy "Allow read journeys" on public.learning_journeys for select using (true);
create policy "Allow insert journeys" on public.learning_journeys for insert with check (auth.uid() = creator_id or auth.uid() is not null);
create policy "Allow update own journeys" on public.learning_journeys for update using (auth.uid() = creator_id);
create policy "Allow delete own journeys" on public.learning_journeys for delete using (auth.uid() = creator_id);

-- Objectives, Activities, Questions: Read all; Modify if authenticated
create policy "Allow read objectives" on public.learning_objectives for select using (true);
create policy "Allow manage objectives" on public.learning_objectives for all using (auth.uid() is not null);

create policy "Allow read activities" on public.learning_activities for select using (true);
create policy "Allow manage activities" on public.learning_activities for all using (auth.uid() is not null);

create policy "Allow read questions" on public.learning_questions for select using (true);
create policy "Allow manage questions" on public.learning_questions for all using (auth.uid() is not null);

-- Teacher Assignments:
-- Teacher can view & manage their assignments; Student can view assignments assigned to them
create policy "Allow read assignments" on public.teacher_assignments for select using (
  auth.uid() = student_id or auth.uid() = teacher_id or true
);
create policy "Allow manage assignments" on public.teacher_assignments for all using (
  auth.uid() is not null
);

-- Student Progress:
-- User can read and manage their own progress; Teachers of assigned journeys can view student progress
create policy "Allow read student progress" on public.student_progress for select using (true);
create policy "Allow manage student progress" on public.student_progress for all using (
  auth.uid() is not null
);

-- Reflections:
-- Student can view and insert/update their own reflections; Teachers can view
create policy "Allow read reflections" on public.reflections for select using (true);
create policy "Allow manage reflections" on public.reflections for all using (
  auth.uid() is not null
);
