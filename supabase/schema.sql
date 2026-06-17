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
  created_at    timestamptz not null default now()
);

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

-- ──────────────────────── Row Level Security ─────────────────────────
-- Each user can only ever see and modify their own rows.
alter table public.profiles  enable row level security;
alter table public.entries   enable row level security;
alter table public.favorites enable row level security;

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
end $$;
