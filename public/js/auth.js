import { supabase, hasSupabaseConfig } from './supabase-client.js';
import { showMessage } from './utils.js';

const statusContainer = document.querySelector('#auth-status');
const signOutButton = document.querySelector('#sign-out');

export async function getUser() {
  if (!hasSupabaseConfig) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
}

function usernameToEmail(username) {
  // create a synthetic email to satisfy Supabase auth
  const clean = String(username).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');
  return `${clean}@wc-predictions.local`;
}

export async function signInWithUsername(username, password) {
  if (!hasSupabaseConfig) throw new Error('Supabase config is not set.');
  const email = usernameToEmail(username);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return true;
}

export async function signUpWithUsername(username, password) {
  if (!hasSupabaseConfig) throw new Error('Supabase config is not set.');
  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  // attempt to create/update the public profile row
  try {
    const userId = data.user?.id;
    if (userId) {
      await supabase.from('profiles').upsert({ id: userId, username: username, total_points: 0 }, { onConflict: ['id'] });
    }
  } catch (err) {
    // non-fatal - show message but allow account creation to proceed
    console.warn('profile upsert failed', err?.message || err);
  }

  return true;
}

export async function signOut() {
  if (!hasSupabaseConfig) return;
  await supabase.auth.signOut();
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
      try {
        await signUpWithUsername(username, password);
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
  if (!hasSupabaseConfig) {
    showMessage(statusContainer, 'Supabase config is missing. Fill in public/js/config.js before using this app.', 'warning');
    return;
  }

  const user = await getUser();
  if (user) {
    // try to show username from profiles table
    let display = user.email || user.id;
    try {
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      if (data?.username) display = data.username;
    } catch (err) {
      // ignore
    }
    showMessage(statusContainer, `Signed in as ${display}`);
  } else {
    showMessage(statusContainer, 'Not signed in. Use the form above or go to Matches once signed in.');
  }
}
