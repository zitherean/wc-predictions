import { supabase } from "./supabase-client.js";
import { showMessage } from './utils.js';

const statusContainer = document.querySelector('#auth-status');
const signOutButton = document.querySelector('#sign-out');

function normalizeUniqueId(uniqueId) {
  return String(uniqueId ?? '').trim().toLowerCase();
}

function validateUsername(username) {
  const value = String(username ?? '').trim();
  if (!/^[a-zA-Z0-9_]{3,}$/.test(value)) {
    throw new Error('Username must be at least 3 characters and contain only letters, numbers, or underscore.');
  }
  return value;
}

function validateDisplayName(displayName) {
  const value = String(displayName ?? '').trim();
  if (!value) {
    throw new Error('Display name is required.');
  }
  return value;
}

function usernameToEmail(username) {
  const clean = normalizeUniqueId(username).replace(/[^a-z0-9._-]/g, '_');
  return `${clean}@wc-predictions.local`;
}

export async function signInWithUsername(username, password) {
  validateUsername(username);
  const email = usernameToEmail(username);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return true;
}

export async function checkDisplayNameAvailable(displayName) {
  const value = validateDisplayName(displayName);
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('display_name', value)
    .maybeSingle();
  if (error) throw error;
  return !data;
}

export async function signUpWithUsername(username, password, displayName) {
  const uniqueId = normalizeUniqueId(validateUsername(username));
  const safeDisplayName = validateDisplayName(displayName);
  const email = usernameToEmail(uniqueId);

  // 1. Check if username already exists
  const { data: existingUsername, error: usernameCheckError } = await supabase
    .from('profiles')
    .select('id')
    .eq('unique_id', uniqueId)
    .maybeSingle();

  if (usernameCheckError) {
    throw usernameCheckError;
  }

  if (existingUsername) {
    throw new Error('This username is already taken. Please choose another one.');
  }

  // 2. Check if display name already exists, case-insensitive
  const { data: existingDisplayName, error: displayNameCheckError } = await supabase
    .from('profiles')
    .select('id')
    .ilike('display_name', safeDisplayName)
    .maybeSingle();

  if (displayNameCheckError) {
    throw displayNameCheckError;
  }

  if (existingDisplayName) {
    throw new Error('This display name is already taken. Please choose another one.');
  }

  // 3. Only now create the Supabase Auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    throw error;
  }

  const userId = data.user?.id;

  if (!userId) {
    throw new Error('Account was created, but no user ID was returned.');
  }

  // 4. Create the profile row
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      unique_id: uniqueId,
      display_name: safeDisplayName
    });

  if (profileError) {
    if (profileError.code === '23505') {
      throw new Error('Account could not be completed because the username or display name was already taken. Please contact the admin or try a different username.');
    }

    throw new Error(`Account was created, but profile setup failed: ${profileError.message}`);
  }

  return true;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
}

export async function initAuthForms() {
  const signInForm = document.querySelector('#sign-in-form');
  const signUpForm = document.querySelector('#sign-up-form');

  if (signInForm) {
    signInForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(signInForm);
      const username = form.get('username');
      const password = form.get('password');
      try {
        await signInWithUsername(username, password);
        showMessage(statusContainer, 'Signed in successfully.', 'success');
        window.location.href = 'matches.html';
      } catch (error) {
        showMessage(statusContainer, error.message || 'Unable to sign in.', 'danger');
      }
    });
  }

  if (signUpForm) {
    signUpForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(signUpForm);
      const username = form.get('username');
      const password = form.get('password');
      const displayName = form.get('displayName');
      try {
        await signUpWithUsername(username, password, displayName);
        showMessage(statusContainer, 'Account created. You can now sign in.', 'success');
        window.location.href = 'index.html';
      } catch (error) {
        showMessage(statusContainer, error.message || 'Unable to create account.', 'danger');
      }
    });
  }

  if (signOutButton) {
    signOutButton.addEventListener('click', async () => {
      await signOut();
      window.location.href = 'index.html';
    });
  }
}

export async function renderUserStatus() {
  if (!statusContainer) return;

  const user = await getUser();
  if (user) {
    let display = user.email || user.id;
    try {
      const { data } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
      if (data?.display_name) display = data.display_name;
    } catch (err) {
      // ignore
    }
    showMessage(statusContainer, `Signed in as ${display}`);
  } else {
    showMessage(statusContainer, 'Not signed in. Use the form above or go to Matches once signed in.');
  }
}

export async function isCurrentUserAdmin() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session?.user) {
    return false;
  }

  const userId = sessionData.session.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return false;
  }

  return profile.is_admin === true;
}
\