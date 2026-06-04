import { supabase } from './supabase-client.js';

export async function getCurrentUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
}

export async function fetchPredictions(matchIds) {
  const userId = await getCurrentUserId();

  if (!userId || !matchIds || matchIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('predictions')
    .select('match_id, predicted_home_score, predicted_away_score, predicted_winner_side')
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

export async function savePrediction(matchId, homeScore, awayScore, predictedWinnerSide = null) {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to save a prediction.');
  }

  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
        predicted_winner_side: predictedWinnerSide
      },
      {
        onConflict: 'user_id,match_id'
      }
    )
    .select();

  if (error) {
    throw error;
  }

  return data;
}
