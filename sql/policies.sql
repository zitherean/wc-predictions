-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;

-- =========================
-- DROP EXISTING POLICIES
-- =========================

drop policy if exists "Authenticated users can read profiles"
on public.profiles;

drop policy if exists "Users can insert own profile"
on public.profiles;

drop policy if exists "Users can update own profile"
on public.profiles;

drop policy if exists "Authenticated users can read matches"
on public.matches;

drop policy if exists "Authenticated users can read predictions"
on public.predictions;

drop policy if exists "Users can insert own predictions"
on public.predictions;

drop policy if exists "Users can update own predictions"
on public.predictions;

drop policy if exists "Users can insert own predictions before kickoff"
on public.predictions;

drop policy if exists "Users can update own predictions before kickoff"
on public.predictions;

-- =========================
-- PROFILES POLICIES
-- =========================

-- Logged-in users can read all profiles.
-- This allows the leaderboard to show display names.
create policy "Authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

-- Users can insert their own profile.
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

-- Users can update their own profile.
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- =========================
-- MATCHES POLICIES
-- =========================

-- Logged-in users can read all matches.
create policy "Authenticated users can read matches"
on public.matches
for select
to authenticated
using (true);

-- =========================
-- PREDICTIONS POLICIES
-- =========================

-- Logged-in users can read all predictions.
-- This makes leaderboard calculations and comparison pages easier.
create policy "Authenticated users can read predictions"
on public.predictions
for select
to authenticated
using (true);

-- Users can insert their own predictions.
create policy "Users can insert own predictions before kickoff"
on public.predictions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.matches
    where matches.id = predictions.match_id
      and matches.kickoff_time > now()
  )
);

-- Users can update their own predictions.
create policy "Users can update own predictions before kickoff"
on public.predictions
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.matches
    where matches.id = predictions.match_id
      and matches.kickoff_time > now()
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.matches
    where matches.id = predictions.match_id
      and matches.kickoff_time > now()
  )
);