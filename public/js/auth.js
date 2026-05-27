import { supabase, hasSupabaseConfig } from './supabase-client.js';
import { showMessage } from './utils.js';

const statusContainer = document.querySelector('#auth-status');
const signOutButton = document.querySelector('#sign-out');

export async function getUser() {
  if (!hasSupabaseConfig) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
}

export async function signIn(email, password) {
  if (!hasSupabaseConfig) throw new Error('Supabase config is not set.');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return true;
}

export async function signUp(email, password) {
  if (!hasSupabaseConfig) throw new Error('Supabase config is not set.');
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
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
      const email = form.get('email');
      const password = form.get('password');
      try {
        await signIn(email, password);
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
      const email = form.get('email');
      const password = form.get('password');
      try {
        await signUp(email, password);
        showMessage(statusContainer, 'Account created. Check your email if confirmation is required.', 'success');
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
    showMessage(statusContainer, `Signed in as ${user.email}`);
  } else {
    showMessage(statusContainer, 'Not signed in. Use the form above or go to Matches once signed in.');
  }
}
