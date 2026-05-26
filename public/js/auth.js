import { supabase } from "./supabase-client.js";

/**
 * Convert a user-facing unique ID into an internal fake email.
 * Supabase Auth needs an email, but users do not need to see it.
 */
function uniqueIdToEmail(uniqueId) {
  const cleanUniqueId = uniqueId.trim().toLowerCase();

  return `${cleanUniqueId}@wc-predictions.local`;
}

/**
 * Sign up with:
 * - uniqueId: used for login
 * - password: used by Supabase Auth
 * - displayName: shown on leaderboard
 */
export async function signUp(uniqueId, password, displayName) {
  const email = uniqueIdToEmail(uniqueId);

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    throw error;
  }

  if (data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        unique_id: uniqueId.trim().toLowerCase(),
        display_name: displayName
      });

    if (profileError) {
      throw profileError;
    }
  }

  return data;
}

/**
 * Sign in with:
 * - uniqueId: user-facing login ID
 * - password
 */
export async function signIn(uniqueId, password) {
  const email = uniqueIdToEmail(uniqueId);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

signUp("qwe", "123456", "qwerty")