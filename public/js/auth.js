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

export async function signUpWithUsername(username, password, displayName) {
  const uniqueId = validateUsername(username);
  const safeDisplayName = validateDisplayName(displayName);
  const email = usernameToEmail(uniqueId);

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  try {
    const userId = data.user?.id;
    if (userId) {
      await supabase.from('profiles').upsert(
        { id: userId, unique_id: uniqueId, display_name: safeDisplayName },
        { onConflict: ['id'] }
      );
    }
  } catch (err) {
    console.warn('profile upsert failed', err?.message || err);
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
