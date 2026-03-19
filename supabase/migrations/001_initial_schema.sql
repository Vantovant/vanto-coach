-- ============================================================
-- Vanto Coach — Initial Schema + Row Level Security
-- Run this in the Supabase SQL editor for your project.
-- ============================================================

-- Enable pgcrypto for UUID generation (available by default on Supabase)
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- One row per authenticated user, created by trigger on signup.
-- ============================================================

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  settings     jsonb default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create profile on new auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- COACH SESSIONS
-- Core table — one row per voice diary entry.
-- ============================================================

create table if not exists public.coach_sessions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  title                   text not null,
  session_date            date not null default current_date,
  audio_url               text,                   -- Supabase Storage path
  audio_duration_seconds  integer,
  raw_transcript          text,
  cleaned_transcript      text,
  summary                 text,
  mood                    text,
  sentiment_score         numeric(4,3),           -- -1.000 to 1.000
  life_areas              text[] not null default '{}',
  spiritual_topics        text[] not null default '{}',
  coach_response          text,
  action_status           text not null default 'none'
                            check (action_status in ('pending','extracted','applied','none')),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz             -- soft delete
);

create index if not exists idx_coach_sessions_user_date
  on public.coach_sessions (user_id, session_date desc);

-- ============================================================
-- COACH STRUCTURED ENTRIES
-- One row per session — the structured breakdown extracted by AI.
-- ============================================================

create table if not exists public.coach_structured_entries (
  id                    uuid primary key default gen_random_uuid(),
  session_id            uuid not null references public.coach_sessions(id) on delete cascade,
  user_id               uuid not null references auth.users(id) on delete cascade,
  wins                  text[] not null default '{}',
  struggles             text[] not null default '{}',
  fears                 text[] not null default '{}',
  decisions             text[] not null default '{}',
  people                text[] not null default '{}',
  opportunities         text[] not null default '{}',
  gratitude             text[] not null default '{}',
  followups             text[] not null default '{}',
  prayer_requests       text[] not null default '{}',
  scripture_reflections text[] not null default '{}',
  habits                text[] not null default '{}',
  finances              text[] not null default '{}',
  health                text[] not null default '{}',
  calling               text[] not null default '{}',
  relationships         text[] not null default '{}',
  leadership            text[] not null default '{}',
  created_at            timestamptz not null default now()
);

create index if not exists idx_coach_structured_entries_session
  on public.coach_structured_entries (session_id);

-- ============================================================
-- COACH ACTION ITEMS
-- Extracted tasks / habits / goals per session.
-- ============================================================

create table if not exists public.coach_action_items (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  session_id               uuid references public.coach_sessions(id) on delete set null,
  action_type              text not null default 'task'
                             check (action_type in ('task','reminder','meeting','goal','habit','prayer_plan','reflection_followup')),
  title                    text not null,
  description              text,
  priority                 text not null default 'medium'
                             check (priority in ('critical','high','medium','low')),
  due_date                 date,
  category                 text,
  linked_plan_entity_id    uuid,
  linked_plan_entity_type  text check (linked_plan_entity_type in ('task','reminder','meeting')),
  source                   text not null default 'coach_extract'
                             check (source in ('coach_entry','coach_extract','coach_memory','coach_scripture_plan')),
  status                   text not null default 'pending'
                             check (status in ('pending','approved','rejected','synced')),
  dedupe_key               text unique,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists idx_coach_action_items_user
  on public.coach_action_items (user_id, created_at desc);

-- ============================================================
-- COACH SCRIPTURE REFS
-- Bible verses linked to a session.
-- ============================================================

create table if not exists public.coach_scripture_refs (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.coach_sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  book        text not null,
  chapter     integer not null,
  verse_start integer not null,
  verse_end   integer,
  text        text not null,
  translation text not null default 'KJV',
  ref_type    text not null default 'supporting'
                check (ref_type in ('primary','supporting')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_coach_scripture_refs_session
  on public.coach_scripture_refs (session_id);

-- ============================================================
-- COACH PRAYER POINTS
-- Prayer points extracted or manually added per session.
-- ============================================================

create table if not exists public.coach_prayer_points (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.coach_sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  content     text not null,
  category    text,
  status      text not null default 'active'
                check (status in ('active','answered','continuing')),
  answered_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_coach_prayer_points_session
  on public.coach_prayer_points (session_id);

-- ============================================================
-- COACH MEMORIES
-- Long-term patterns and insights extracted across sessions.
-- ============================================================

create table if not exists public.coach_memories (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  memory_type          text not null,
  title                text not null,
  summary              text not null,
  confidence           integer not null default 50 check (confidence between 0 and 100),
  first_seen_at        timestamptz not null default now(),
  last_seen_at         timestamptz not null default now(),
  occurrence_count     integer not null default 1,
  related_session_ids  uuid[] not null default '{}',
  scripture_refs       jsonb not null default '[]'::jsonb,
  suggested_actions    text[] not null default '{}',
  growth_indicators    jsonb not null default '[]'::jsonb,
  is_pinned            boolean not null default false,
  is_archived          boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_coach_memories_user
  on public.coach_memories (user_id, last_seen_at desc);

-- ============================================================
-- updated_at triggers
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_coach_sessions
  before update on public.coach_sessions
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_coach_action_items
  before update on public.coach_action_items
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_coach_prayer_points
  before update on public.coach_prayer_points
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_coach_memories
  before update on public.coach_memories
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Every table: users can only read/write their own rows.
-- ============================================================

-- profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- coach_sessions
alter table public.coach_sessions enable row level security;
create policy "Users can select own sessions"
  on public.coach_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions"
  on public.coach_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions"
  on public.coach_sessions for update using (auth.uid() = user_id);
create policy "Users can delete own sessions"
  on public.coach_sessions for delete using (auth.uid() = user_id);

-- coach_structured_entries
alter table public.coach_structured_entries enable row level security;
create policy "Users can select own structured entries"
  on public.coach_structured_entries for select using (auth.uid() = user_id);
create policy "Users can insert own structured entries"
  on public.coach_structured_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own structured entries"
  on public.coach_structured_entries for update using (auth.uid() = user_id);
create policy "Users can delete own structured entries"
  on public.coach_structured_entries for delete using (auth.uid() = user_id);

-- coach_action_items
alter table public.coach_action_items enable row level security;
create policy "Users can select own action items"
  on public.coach_action_items for select using (auth.uid() = user_id);
create policy "Users can insert own action items"
  on public.coach_action_items for insert with check (auth.uid() = user_id);
create policy "Users can update own action items"
  on public.coach_action_items for update using (auth.uid() = user_id);
create policy "Users can delete own action items"
  on public.coach_action_items for delete using (auth.uid() = user_id);

-- coach_scripture_refs
alter table public.coach_scripture_refs enable row level security;
create policy "Users can select own scripture refs"
  on public.coach_scripture_refs for select using (auth.uid() = user_id);
create policy "Users can insert own scripture refs"
  on public.coach_scripture_refs for insert with check (auth.uid() = user_id);
create policy "Users can update own scripture refs"
  on public.coach_scripture_refs for update using (auth.uid() = user_id);
create policy "Users can delete own scripture refs"
  on public.coach_scripture_refs for delete using (auth.uid() = user_id);

-- coach_prayer_points
alter table public.coach_prayer_points enable row level security;
create policy "Users can select own prayer points"
  on public.coach_prayer_points for select using (auth.uid() = user_id);
create policy "Users can insert own prayer points"
  on public.coach_prayer_points for insert with check (auth.uid() = user_id);
create policy "Users can update own prayer points"
  on public.coach_prayer_points for update using (auth.uid() = user_id);
create policy "Users can delete own prayer points"
  on public.coach_prayer_points for delete using (auth.uid() = user_id);

-- coach_memories
alter table public.coach_memories enable row level security;
create policy "Users can select own memories"
  on public.coach_memories for select using (auth.uid() = user_id);
create policy "Users can insert own memories"
  on public.coach_memories for insert with check (auth.uid() = user_id);
create policy "Users can update own memories"
  on public.coach_memories for update using (auth.uid() = user_id);
create policy "Users can delete own memories"
  on public.coach_memories for delete using (auth.uid() = user_id);

-- ============================================================
-- STORAGE — coach-audio bucket
-- Users can only access their own folder (user_id prefix).
-- Create this bucket in the Supabase dashboard first:
--   Storage → New bucket → "coach-audio" → Private
-- ============================================================

-- Storage policies are set in the Supabase Dashboard under Storage > Policies,
-- or via the management API. The bucket must be created manually.
-- Recommended policy expressions:

-- SELECT (download): (auth.uid()::text = (storage.foldername(name))[1])
-- INSERT (upload):   (auth.uid()::text = (storage.foldername(name))[1])
-- UPDATE:            (auth.uid()::text = (storage.foldername(name))[1])
-- DELETE:            (auth.uid()::text = (storage.foldername(name))[1])
