insert into public.matches (
  api_match_id,
  home_team,
  away_team,
  kickoff_time,
  stage,
  status,
  home_score,
  away_score,
  winner_side
)
values
  -- GROUP STAGE TESTS

  -- Exact score test: prediction 2-1 should get 5
  -- Correct result test: prediction 1-0 should get 3
  (
    'test_group_001',
    'Mexico',
    'South Africa',
    '2026-06-11 19:00:00+00',
    'Group stage',
    'finished',
    2,
    1,
    'home'
  ),

  -- Draw test: prediction 1-1 should get 5
  -- Correct draw but wrong score: prediction 0-0 should get 3
  (
    'test_group_002',
    'Canada',
    'Japan',
    '2026-06-12 01:00:00+00',
    'Group stage',
    'finished',
    1,
    1,
    'draw'
  ),

  -- Away winner test: prediction 0-2 should get 5
  -- Correct away winner but wrong score: prediction 1-3 should get 3
  (
    'test_group_003',
    'Netherlands',
    'Germany',
    '2026-06-18 13:00:00+00',
    'Group stage',
    'finished',
    0,
    2,
    'away'
  ),

  -- Wrong result test: prediction Curacao win should get 0
  (
    'test_group_004',
    'Curacao',
    'Brazil',
    '2026-06-15 03:00:00+00',
    'Group stage',
    'finished',
    0,
    3,
    'away'
  ),

  -- KNOCKOUT TESTS

  (
    'test_ko_032',
    'Switzerland',
    'Algeria',
    '2026-07-03 19:00:00+00',
    'Round of 32',
    'finished',
    5,
    1,
    'home'
  ),

  -- Knockout exact score + correct advancing team
  -- prediction 2-1 should get 7: 5 exact + 2 bonus
  -- prediction 1-0 should get 5: 3 correct result + 2 bonus
  (
    'test_ko_001',
    'Argentina',
    'France',
    '2026-07-04 19:00:00+00',
    'Round of 16',
    'finished',
    2,
    1,
    'home'
  ),

  -- Knockout draw after regular/extra time, home advances
  -- prediction 1-1 + predicted_winner_side = home should get 7: 5 exact + 2 bonus
  -- prediction 0-0 + predicted_winner_side = home should get 5: 3 correct draw + 2 bonus
  -- prediction 1-1 + predicted_winner_side = away should get 5: exact score only, no bonus
  (
    'test_ko_002',
    'Spain',
    'Portugal',
    '2026-07-05 19:00:00+00',
    'Quarter-final',
    'finished',
    1,
    1,
    'home'
  ),

  -- Knockout away team advances
  -- prediction 0-1 should get 7: 5 exact + 2 bonus
  -- prediction 1-2 should get 5: 3 correct result + 2 bonus
  (
    'test_ko_003',
    'England',
    'Italy',
    '2026-07-08 19:00:00+00',
    'Semi-final',
    'finished',
    0,
    1,
    'away'
  ),

  -- Knockout final draw, away advances
  -- prediction 2-2 + predicted_winner_side = away should get 7
  -- prediction 2-2 + predicted_winner_side = home should get 5
  (
    'test_ko_004',
    'Brazil',
    'Germany',
    '2026-07-19 19:00:00+00',
    'Final',
    'finished',
    2,
    2,
    'away'
  )
on conflict (api_match_id) do update
set
  home_team = excluded.home_team,
  away_team = excluded.away_team,
  kickoff_time = excluded.kickoff_time,
  stage = excluded.stage,
  status = excluded.status,
  home_score = excluded.home_score,
  away_score = excluded.away_score,
  winner_side = excluded.winner_side;