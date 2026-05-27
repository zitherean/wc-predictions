import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const hasSupabaseConfig = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('<YOUR_') &&
  !SUPABASE_ANON_KEY.includes('<YOUR_')
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
