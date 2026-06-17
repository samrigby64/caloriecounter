-- Calorie Counter — Supabase schema
-- Run this once in your project's SQL Editor (Dashboard → SQL Editor → New query).
-- It is safe to re-run: every statement is idempotent.

-- ───────────────────────────── profiles ──────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  calorie_goal  integer not null default 2000,
  protein_goal  integer not null default 120,
  carbs_goal    integer not null default 230,
  fat_goal      integer not null default 65,
  water_goal    integer not null default 8,
  created_at    timestamptz not null default now()
);

-- Added after first release; safe to run on an existing project.
alter table public.profiles
  add column if not exists water_goal integer not null default 8;

-- ────────────────────────────── entries ──────────────────────────────
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        date not null,
  meal        text not null check (meal in ('breakfast','lunch','dinner','snack')),
  name        text not null,
  calories    integer not null default 0,
  protein     numeric not null default 0,
  carbs       numeric not null default 0,
  fat         numeric not null default 0,
  serving     text,
  barcode     text,
  created_at  timestamptz not null default now()
);

create index if not exists entries_user_date_idx
  on public.entries (user_id, date);

-- ───────────────────────────── favorites ─────────────────────────────
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  calories    integer not null default 0,
  protein     numeric not null default 0,
  carbs       numeric not null default 0,
  fat         numeric not null default 0,
  serving     text,
  barcode     text,
  created_at  timestamptz not null default now()
);

create index if not exists favorites_user_idx
  on public.favorites (user_id);

-- ─────────────────────────────── water ───────────────────────────────
-- One row per user per day; glasses are 250 ml each.
create table if not exists public.water (
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        date not null,
  glasses     integer not null default 0,
  primary key (user_id, date)
);

-- ─────────────────────────────── weights ─────────────────────────────
-- One body-weight reading per user per day (kg).
create table if not exists public.weights (
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        date not null,
  weight      numeric not null,
  primary key (user_id, date)
);

-- ──────────────────────── Row Level Security ─────────────────────────
-- Each user can only ever see and modify their own rows.
alter table public.profiles  enable row level security;
alter table public.entries   enable row level security;
alter table public.favorites enable row level security;
alter table public.water     enable row level security;
alter table public.weights   enable row level security;

do $$
begin
  -- profiles
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'own profile') then
    create policy "own profile" on public.profiles
      for all using (auth.uid() = id) with check (auth.uid() = id);
  end if;

  -- entries
  if not exists (select 1 from pg_policies where tablename = 'entries' and policyname = 'own entries') then
    create policy "own entries" on public.entries
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  -- favorites
  if not exists (select 1 from pg_policies where tablename = 'favorites' and policyname = 'own favorites') then
    create policy "own favorites" on public.favorites
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  -- water
  if not exists (select 1 from pg_policies where tablename = 'water' and policyname = 'own water') then
    create policy "own water" on public.water
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  -- weights
  if not exists (select 1 from pg_policies where tablename = 'weights' and policyname = 'own weights') then
    create policy "own weights" on public.weights
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
