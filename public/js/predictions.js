import { supabase } from './supabase-client.js';

export async function getCurrentUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
}

export async function fetchPredictions(matchIds) {
  const userId = await getCurrentUserId();
  if (!userId || !matchIds || matchIds.length === 0) return {};

  const { data, error } = await supabase
    .from('predictions')
    .select('match_id, predicted_home_score, predicted_away_score')
    .eq('user_id', userId)
    .in('match_id', matchIds);

  if (error) {
    throw error;
  }

  return (data || []).reduce((map, prediction) => {
    map[prediction.match_id] = prediction;
    return map;
  }, {});
}

export async function savePrediction(matchId, home, away) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('You must be signed in to save a prediction.');
  }

  const { error } = await supabase.from('predictions').upsert(
    {
      user_id: userId,
      match_id: matchId,
      predicted_home_score: home,
      predicted_away_score: away,
    },
    { onConflict: ['user_id', 'match_id'] }
  );

  if (error) {
    throw error;
  }
}
