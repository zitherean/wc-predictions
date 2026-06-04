import { createClient } from "@supabase/supabase-js";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const COMPETITION_CODE = "WC";

const LOW_REQUEST_WARNING_THRESHOLD = 2;

function createServerSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function getRateLimitInfo(apiResponse) {
  const requestsAvailableRaw = apiResponse.headers.get("X-Requests-Available-Minute");
  const resetSecondsRaw = apiResponse.headers.get("X-RequestCounter-Reset");

  return {
    requestsAvailable:
      requestsAvailableRaw === null ? null : Number(requestsAvailableRaw),
    resetSeconds: resetSecondsRaw === null ? null : Number(resetSecondsRaw),
    authenticatedClient: apiResponse.headers.get("X-Authenticated-Client"),
    apiVersion: apiResponse.headers.get("X-API-Version")
  };
}

function mapStatus(apiStatus) {
  switch (apiStatus) {
    case "SCHEDULED":
    case "TIMED":
      return "scheduled";
    case "IN_PLAY":
    case "PAUSED":
      return "live";
    case "FINISHED":
      return "finished";
    case "POSTPONED":
      return "postponed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "scheduled";
  }
}

function mapWinnerSide(apiWinner) {
  switch (apiWinner) {
    case "HOME_TEAM":
      return "home";
    case "AWAY_TEAM":
      return "away";
    case "DRAW":
      return "draw";
    default:
      return null;
  }
}

function extractScore(match) {
  const fullTime = match.score?.fullTime;

  return {
    home_score: typeof fullTime?.home === "number" ? fullTime.home : null,
    away_score: typeof fullTime?.away === "number" ? fullTime.away : null
  };
}

function mapApiMatchToDatabaseMatch(match) {
  const { home_score, away_score } = extractScore(match);

  return {
    api_match_id: String(match.id),
    home_team: match.homeTeam?.name ?? "TBD",
    away_team: match.awayTeam?.name ?? "TBD",
    kickoff_time: match.utcDate,
    stage: match.stage ?? null,
    status: mapStatus(match.status),
    home_score,
    away_score,
    winner_side: mapWinnerSide(match.score?.winner),
    last_synced_at: new Date().toISOString()
  };
}

async function requireAdmin(request, supabase) {
  const authHeader = request.headers.authorization || '';
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
    user,
    profile
  };
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed"
    });
  }

  if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.FOOTBALL_DATA_API_KEY
  ) {
    return response.status(500).json({
      error: "Missing required environment variables."
    });
  }

  const supabase = createServerSupabaseClient();

  const adminCheck = await requireAdmin(request, supabase);

  if (!adminCheck.ok) {
    return response.status(adminCheck.status).json({
      error: adminCheck.error
    });
  }

  const apiUrl = `${FOOTBALL_DATA_BASE_URL}/competitions/${COMPETITION_CODE}/matches`;

  let apiResponse;

  try {
    apiResponse = await fetch(apiUrl, {
      headers: {
        "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY
      }
    });
  } catch (error) {
    return response.status(500).json({
      error: "Failed to call football-data.org.",
      details: error.message
    });
  }

  const rateLimitInfo = getRateLimitInfo(apiResponse);

  if (apiResponse.status === 429) {
    return response.status(429).json({
      error: "Football API rate limit reached.",
      message: `Try again in approximately ${
        rateLimitInfo.resetSeconds ?? "a few"
      } seconds.`,
      rateLimitInfo
    });
  }

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();

    return response.status(apiResponse.status).json({
      error: "Football API request failed.",
      details: errorText,
      rateLimitInfo
    });
  }

  if (
    rateLimitInfo.requestsAvailable !== null &&
    rateLimitInfo.requestsAvailable <= LOW_REQUEST_WARNING_THRESHOLD
  ) {
    console.warn("Football API request limit is low:", rateLimitInfo);
  }

  const apiData = await apiResponse.json();

  const matches = apiData.matches.map(mapApiMatchToDatabaseMatch);

  const { data, error } = await supabase
    .from("matches")
    .upsert(matches, {
      onConflict: "api_match_id"
    })
    .select();

  if (error) {
    return response.status(500).json({
      error: "Failed to update Supabase matches table.",
      details: error,
      rateLimitInfo
    });
  }

  return response.status(200).json({
    message: "Matches synced successfully.",
    syncedCount: data.length,
    warning:
      rateLimitInfo.requestsAvailable !== null &&
      rateLimitInfo.requestsAvailable <= LOW_REQUEST_WARNING_THRESHOLD
        ? "Football API request limit is low. Avoid syncing again until the counter resets."
        : null,
    rateLimitInfo
  });
}