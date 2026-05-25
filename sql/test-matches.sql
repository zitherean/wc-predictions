insert into public.matches (
  api_match_id,
  home_team,
  away_team,
  kickoff_time,
  stage,
  status
)
values
  (
    'test_001',
    'Mexico',
    'South Africa',
    '2026-06-11 19:00:00+00',
    'Group stage',
    'scheduled'
  ),
  (
    'test_002',
    'Canada',
    'TBD',
    '2026-06-12 01:00:00+00',
    'Group stage',
    'scheduled'
  )
on conflict (api_match_id) do nothing;