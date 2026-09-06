-- =========================================================================
-- Ghoomo - Social-to-Itinerary Platform Database Schema (PostgreSQL / Supabase)
-- =========================================================================

create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  username text unique,
  credits int default 9 check (credits >= 0),
  avatar_url text,
  travel_style text default 'solo',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,20}$')
);

-- 2. TRIPS
create table if not exists public.trips (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null,
  destination_region text not null,
  start_date date,
  duration_days int default 3,
  budget_total numeric default 15000,
  travel_style text default 'friends',
  cover_image text,
  status text default 'planned' check (status in ('draft', 'planned', 'ongoing', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. TRIP SOURCES (Pasted TikTok, Instagram Reels, YouTube, Blogs)
create table if not exists public.trip_sources (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips on delete cascade not null,
  url text not null,
  platform text not null check (platform in ('instagram', 'tiktok', 'youtube', 'blog', 'other')),
  title text,
  author text,
  thumbnail_url text,
  created_at timestamptz default now()
);

-- 4. PLACES (Detected from content or manually added)
create table if not exists public.places (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips on delete cascade not null,
  source_id uuid references public.trip_sources on delete set null,
  name text not null,
  city text not null,
  state text not null,
  lat numeric not null,
  lng numeric not null,
  category text default 'attraction',
  confidence numeric default 0.9 check (confidence >= 0.0 and confidence <= 1.0),
  is_manual boolean default false,
  image_url text,
  notes text,
  created_at timestamptz default now()
);

-- 5. ITINERARY DAYS
create table if not exists public.itinerary_days (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips on delete cascade not null,
  day_number int not null,
  date date,
  theme text,
  notes text,
  created_at timestamptz default now()
);

-- 6. ITINERARY ITEMS (Places assigned to a day and time slot)
create table if not exists public.itinerary_items (
  id uuid default uuid_generate_v4() primary key,
  day_id uuid references public.itinerary_days on delete cascade not null,
  place_id uuid references public.places on delete cascade not null,
  order_index int default 0,
  time_slot text default 'morning' check (time_slot in ('morning', 'afternoon', 'evening', 'night')),
  duration_minutes int default 90,
  notes text,
  created_at timestamptz default now()
);

-- 7. COLLABORATION INVITES & MEMBERS
create table if not exists public.collaboration_invites (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips on delete cascade not null,
  email text not null,
  role text default 'editor' check (role in ('viewer', 'editor')),
  invite_token text unique default uuid_generate_v4()::text,
  status text default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz default now()
);

-- 8. BUDGET ITEMS
create table if not exists public.budget_items (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips on delete cascade not null,
  category text not null check (category in ('stay', 'transport', 'food', 'activity', 'shopping', 'other')),
  description text not null,
  amount numeric not null,
  is_paid boolean default false,
  created_at timestamptz default now()
);

-- 9. CHECKLIST ITEMS
create table if not exists public.checklist_items (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips on delete cascade not null,
  category text default 'packing' check (category in ('packing', 'booking', 'documents', 'gear', 'other')),
  title text not null,
  is_completed boolean default false,
  assigned_to text,
  created_at timestamptz default now()
);

-- =========================================================================
-- 10. PLACES REFERENCE (Canonical India Tourism Dataset for Fuzzy Matching)
-- =========================================================================

create extension if not exists "pg_trgm";

create table if not exists public.places_reference (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  city text not null,
  state text not null,
  lat double precision not null,
  lng double precision not null,
  category text not null,
  description text,
  image_url text,
  source text default 'Kaggle/Wikipedia/data.gov.in',
  popularity_score numeric default 0.85 check (popularity_score >= 0.0 and popularity_score <= 1.0),
  search_tokens text,
  created_at timestamptz default now()
);

-- Indexes for Fast Match & Geosearch
-- 1. Trigram index on (name, city) for high-performance fuzzy matching
create index if not exists idx_places_reference_trgm on public.places_reference using gin ((name || ' ' || city) gin_trgm_ops);
create index if not exists idx_places_reference_name_trgm on public.places_reference using gin (name gin_trgm_ops);
create index if not exists idx_places_reference_city on public.places_reference (city);

-- 2. Geospatial index on (lat, lng)
create index if not exists idx_places_reference_geo on public.places_reference (lat, lng);

-- 11. POLLS (Live Polling for Places, Budget Approvals, Task Assignments)
create table if not exists public.polls (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips on delete cascade not null,
  created_by uuid references auth.users on delete set null,
  creator_name text,
  type text not null check (type in ('place', 'budget', 'task')),
  target_id text not null,
  title text not null,
  options jsonb not null default '["Yes", "No", "Maybe"]'::jsonb,
  status text default 'open' check (status in ('open', 'closed')),
  closes_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

-- 12. VOTES (User Votes in Polls)
create table if not exists public.votes (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references public.polls on delete cascade not null,
  user_id text not null,
  username text not null,
  avatar_url text,
  vote_option text not null,
  created_at timestamptz default now(),
  constraint unique_user_vote_per_poll unique (poll_id, user_id)
);

-- 13. TRANSACTIONS (Razorpay Payment & Credit Top-Up History)
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  order_id text not null unique,
  payment_id text unique,
  plan_id text not null check (plan_id in ('starter', 'explorer', 'unlimited')),
  amount numeric not null,
  credits_added int not null,
  currency text default 'INR',
  status text default 'created' check (status in ('created', 'captured', 'failed')),
  signature text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_sources enable row level security;
alter table public.places enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.collaboration_invites enable row level security;
alter table public.budget_items enable row level security;
alter table public.checklist_items enable row level security;
alter table public.places_reference enable row level security;
alter table public.polls enable row level security;
alter table public.votes enable row level security;
alter table public.transactions enable row level security;

-- Permissive demo policies (hackathon friendly with user_id check fallback)
create policy "Allow all authenticated/anon read trips" on public.trips for select using (true);
create policy "Allow insert trips" on public.trips for insert with check (true);
create policy "Allow update own trips" on public.trips for update using (true);
create policy "Allow delete own trips" on public.trips for delete using (true);

create policy "Allow all sources" on public.trip_sources for all using (true);
create policy "Allow all places" on public.places for all using (true);
create policy "Allow all days" on public.itinerary_days for all using (true);
create policy "Allow all items" on public.itinerary_items for all using (true);
create policy "Allow all invites" on public.collaboration_invites for all using (true);
create policy "Allow all budget" on public.budget_items for all using (true);
create policy "Allow all checklist" on public.checklist_items for all using (true);
create policy "Allow profiles" on public.profiles for all using (true);
create policy "Allow all read places_reference" on public.places_reference for select using (true);
create policy "Allow admin insert places_reference" on public.places_reference for insert with check (true);
create policy "Allow all polls" on public.polls for all using (true);
create policy "Allow all votes" on public.votes for all using (true);
create policy "Allow all transactions" on public.transactions for all using (true);

-- Enable Supabase Realtime for collaborative polls & votes
alter publication supabase_realtime add table public.polls;
alter publication supabase_realtime add table public.votes;

