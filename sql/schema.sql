-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Drop existing tables
drop table if exists public.predictions;
drop table if exists public.profiles;

-- User profile table
-- Supabase Auth stores users in auth.users.
-- This table stores public game information linked to each user.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  unique_id text unique not null,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),

  constraint unique_id_min_length check (char_length(unique_id) >= 3),
  constraint unique_id_format check (unique_id ~ '^[a-zA-Z0-9_]+$')
);

-- World Cup matches table
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  api_match_id text unique not null,
  home_team text not null,
  away_team text not null,
  kickoff_time timestamptz not null,
  stage text,
  status text not null default 'scheduled',
  home_score int,
  away_score int,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- User predictions table
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  predicted_home_score int not null,
  predicted_away_score int not null,
  points int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One prediction per user per match
  constraint unique_user_match unique (user_id, match_id),

  -- Basic score validation
  constraint predicted_home_score_non_negative check (predicted_home_score >= 0),
  constraint predicted_away_score_non_negative check (predicted_away_score >= 0)
);

-- Leaderboard view to query
create or replace view public.leaderboard as
select
  profiles.id,
  profiles.display_name,
  profiles.unique_id,
  coalesce(sum(predictions.points), 0) as total_points,
  count(predictions.id) as predictions_count
from public.profiles
left join public.predictions
  on predictions.user_id = profiles.id
group by
  profiles.id,
  profiles.display_name,
  profiles.unique_id
order by total_points desc;