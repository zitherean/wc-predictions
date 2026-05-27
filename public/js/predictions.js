import { supabase, hasSupabaseConfig } from './supabase-client.js';

export async function getCurrentUserId() {
  if (!hasSupabaseConfig) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
}

export async function fetchPredictions(matchIds) {
  if (!hasSupabaseConfig) return {};
  const userId = await getCurrentUserId();
  if (!userId) return {};

  const { data, error } = await supabase
    .from('predictions')
    .select('match_id, predicted_home, predicted_away')
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
  if (!hasSupabaseConfig) {
    throw new Error('Supabase config is not set.');
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('You must be signed in to save a prediction.');
  }

  const payload = {
    user_id: userId,
    match_id: Number(matchId),
    predicted_home: home,
    predicted_away: away,
  };

  const { error } = await supabase.from('predictions').upsert(payload, { onConflict: ['user_id', 'match_id'] });
  if (error) throw error;
}
