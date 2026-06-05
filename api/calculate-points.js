import { createClient } from "@supabase/supabase-js";

function createServerSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function requireAdminOrCron(request, supabase) {
  const authHeader = request.headers.authorization || '';

  if (
    process.env.CRON_SECRET &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  ) {
    return {
      ok: true,
      source: 'cron'
    };
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'Missing authorization token.'
    };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return {
      ok: false,
      status: 401,
      error: 'Invalid or expired session.'
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin, display_name')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return {
      ok: false,
      status: 500,
      error: 'Unable to check admin profile.'
    };
  }

  if (!profile?.is_admin) {
    return {
      ok: false,
      status: 403,
      error: 'Admin access required.'
    };
  }

  return {
    ok: true,
    source: 'admin',
    user,
    profile
  };
}

function isKnockoutMatch(stage) {
  if (!stage) return false;

  const normalizedStage = stage.toLowerCase();

  return (
    normalizedStage.includes("last_32") ||
    normalizedStage.includes("round_of_32") ||
    normalizedStage.includes("round of 32") ||
    normalizedStage.includes("last_16") ||
    normalizedStage.includes("round_of_16") ||
    normalizedStage.includes("round of 16") ||
    normalizedStage.includes("quarter") ||
    normalizedStage.includes("semi") ||
    normalizedStage.includes("third_place") ||
    normalizedStage.includes("third place") ||
    normalizedStage.includes("final")
  );
}

function getResultSide(homeScore, awayScore) {
  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";
  return "draw";
}

function calculatePredictionPoints(prediction) {
  const match = prediction.matches;

  if (!match) {
    return 0;
  }

  const actualHome = match.home_score;
  const actualAway = match.away_score;
  const predictedHome = prediction.predicted_home_score;
  const predictedAway = prediction.predicted_away_score;

  if (
    actualHome === null ||
    actualHome === undefined ||
    actualAway === null ||
    actualAway === undefined
  ) {
    return 0;
  }

  const exactScore =
    predictedHome === actualHome && predictedAway === actualAway;

  const predictedResult = getResultSide(predictedHome, predictedAway);
  const actualResult = getResultSide(actualHome, actualAway);

  let points = 0;

  if (exactScore) {
    points = 5;
  } else if (predictedResult === actualResult) {
    points = 3;
  }

  const knockout = isKnockoutMatch(match.stage);

  if (knockout) {
    const actualAdvancingSide = match.winner_side || actualResult;
    const predictedAdvancingSide =
      prediction.predicted_winner_side || predictedResult;

    if (
      actualAdvancingSide !== 'draw' &&
      predictedAdvancingSide === actualAdvancingSide
    ) {
      points += 2;
    }
  }

  return points;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return response.status(500).json({
      error: "Missing required environment variables."
    });
  }

  const supabase = createServerSupabaseClient();

  const adminCheck = await requireAdminOrCron(request, supabase);

  if (!adminCheck.ok) {
    return response.status(adminCheck.status).json({
      error: adminCheck.error
    });
  }

  const { data: predictions, error: fetchError } = await supabase
    .from("predictions")
    .select(`
      id,
      predicted_home_score,
      predicted_away_score,
      predicted_winner_side,
      points,
      matches (
        id,
        stage,
        status,
        home_score,
        away_score,
        winner_side
      )
  `);

  if (fetchError) {
    return response.status(500).json({
      error: "Failed to fetch predictions.",
      details: fetchError
    });
  }

  const finishedPredictions = predictions.filter((prediction) => {
    const match = prediction.matches;

    return (
      match &&
      match.status === "finished" &&
      match.home_score !== null &&
      match.away_score !== null
    );
  });

  const updates = finishedPredictions.map((prediction) => {
    return {
      id: prediction.id,
      points: calculatePredictionPoints(prediction)
    };
  });

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from("predictions")
      .update({
        points: update.points,
        updated_at: new Date().toISOString()
      })
      .eq("id", update.id);

    if (updateError) {
      return response.status(500).json({
        error: "Failed to update prediction points.",
        predictionId: update.id,
        details: updateError
      });
    }
  }

  return response.status(200).json({
    message: "Points recalculated successfully.",
    checkedPredictions: predictions.length,
    updatedPredictions: updates.length
  });
}