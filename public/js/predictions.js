import { supabase } from "./supabase-client.js";

export async function savePrediction(matchId, homeScore, awayScore) {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to save a prediction.");
  }

  const { data, error } = await supabase
    .from("predictions")
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore
      },
      {
        onConflict: "user_id,match_id"
      }
    )
    .select();

  if (error) {
    throw error;
  }

  return data;
}

async function loadPredictedMatches() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  console.log("Current user:", user);

  const { data, error } = await supabase
    .from("predictions")
    .select("*")

  if (error) {
    console.error("Error loading matches:", error);
    return;
  }

  console.log("Predicted matches:", data);
}

savePrediction("fe58baae-8d41-4292-b812-5dcf9532ac10", 2, 4);

savePrediction("4b0de52d-99d5-4a4f-bab1-085c0fd7c8e7", 0, 0);

loadPredictedMatches();import { supabase, hasSupabaseConfig } from './supabase-client.js';

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
