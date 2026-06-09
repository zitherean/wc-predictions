function getBaseUrl(request) {
  const host = request.headers.host;

  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }

  if (host?.includes('localhost')) {
    return `http://${host}`;
  }

  return `https://${host}`;
}

function checkCronSecret(request) {
  const authHeader = request.headers.authorization || '';

  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

async function callEndpoint(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
      'Content-Type': 'application/json'
    }
  });

  const text = await response.text();

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return {
    url: `${baseUrl}${path}`,
    path,
    status: response.status,
    ok: response.ok,
    body
  };
}

export default async function handler(request, response) {
  console.log('Cron update started');

  if (request.method !== 'GET') {
    return response.status(405).json({
      error: 'Method not allowed'
    });
  }

  if (!process.env.CRON_SECRET) {
    return response.status(500).json({
      error: 'Missing CRON_SECRET environment variable.'
    });
  }

  if (!checkCronSecret(request)) {
    return response.status(401).json({
      error: 'Unauthorized cron request.'
    });
  }

  const baseUrl = getBaseUrl(request);

  console.log('Cron base URL:', baseUrl);

  const syncResult = await callEndpoint(baseUrl, '/api/sync-matches');

  console.log('Sync result:', JSON.stringify(syncResult, null, 2));

  if (!syncResult.ok) {
    return response.status(500).json({
      error: 'Cron update failed during match sync.',
      syncResult
    });
  }

  const pointsResult = await callEndpoint(baseUrl, '/api/calculate-points');

  console.log('Points result:', JSON.stringify(pointsResult, null, 2));

  if (!pointsResult.ok) {
    return response.status(500).json({
      error: 'Cron update failed during points calculation.',
      syncResult,
      pointsResult
    });
  }

  return response.status(200).json({
    message: 'Cron update completed successfully.',
    syncResult,
    pointsResult
  });
}