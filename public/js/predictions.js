import {
  getCurrentUser,
  getSavedPredictions,
  loadSnapshotPredictions,
  saveUserPrediction,
} from './data.js';

const PLAYER_06_ID = 'b2e80ec5-ec27-45cf-a01d-6dac807e3d93';

export async function getCurrentUserId() {
  return getCurrentUser()?.id || PLAYER_06_ID;
}

export async function fetchPredictions(matchIds) {
  const userId = await getCurrentUserId();

  if (!matchIds || matchIds.length === 0) {
    return {};
  }

  const saved = getSavedPredictions(userId);
  const snapshot = await loadSnapshotPredictions();
  const player06Predictions = snapshot
    .filter((prediction) => prediction.user_id === PLAYER_06_ID)
    .reduce((map, prediction) => {
      map[prediction.match_id] = prediction;
      return map;
    }, {});

  return Object.fromEntries(
    matchIds
      .filter((id) => saved[id] || player06Predictions[id])
      .map((id) => [id, saved[id] || player06Predictions[id]])
  );
}

export async function savePrediction(matchId, homeScore, awayScore, predictedWinnerSide = null) {
  const userId = getCurrentUser()?.id || PLAYER_06_ID;
  const prediction = { user_id: userId, match_id: matchId, predicted_home_score: homeScore, predicted_away_score: awayScore, predicted_winner_side: predictedWinnerSide };
  saveUserPrediction(userId, prediction);
  return [prediction];
}
