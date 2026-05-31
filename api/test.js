export default function handler(request, response) {
  return response.status(200).json({
    supabaseUrlExists: Boolean(process.env.SUPABASE_URL),
    serviceRoleExists: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    footballKeyExists: Boolean(process.env.FOOTBALL_DATA_API_KEY),
    nodeEnv: process.env.NODE_ENV
  });
}