import {
  clearCurrentUser,
  getCurrentUser,
  getLocalAccounts,
  loadProfiles,
  saveLocalAccount,
  setCurrentUser,
} from './data.js';
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
  const uniqueId = normalizeUniqueId(validateUsername(username));
  if (!String(password || '').trim()) throw new Error('Password is required.');
  const profiles = await loadProfiles();
  const accounts = getLocalAccounts();
  const profile = [...accounts, ...profiles].find((item) => item.unique_id === uniqueId);
  if (!profile) throw new Error('Username not found.');
  const account = accounts.find((item) => item.unique_id === uniqueId);
  if (account && account.password !== password) throw new Error('Incorrect password.');
  setCurrentUser({ id: profile.id, unique_id: profile.unique_id, display_name: profile.display_name, is_admin: profile.is_admin === true });
  return true;
}

export async function checkDisplayNameAvailable(displayName) {
  const value = validateDisplayName(displayName);
  const profiles = await loadProfiles();
  return ![...profiles, ...getLocalAccounts()].some((profile) => profile.display_name.toLowerCase() === value.toLowerCase());
}

export async function signUpWithUsername(username, password, displayName) {
  const uniqueId = normalizeUniqueId(validateUsername(username));
  const safeDisplayName = validateDisplayName(displayName);
  const profiles = await loadProfiles();
  const allProfiles = [...profiles, ...getLocalAccounts()];
  if (allProfiles.some((profile) => profile.unique_id === uniqueId)) {
    throw new Error('This username is already taken. Please choose another one.');
  }
  if (allProfiles.some((profile) => profile.display_name.toLowerCase() === safeDisplayName.toLowerCase())) {
    throw new Error('This display name is already taken. Please choose another one.');
  }
  if (String(password || '').length < 1) throw new Error('Password is required.');
  const account = { id: crypto.randomUUID(), unique_id: uniqueId, display_name: safeDisplayName, password, is_admin: false };
  saveLocalAccount(account);
  return true;
}

export async function signOut() {
  clearCurrentUser();
}

export async function getUser() {
  return getCurrentUser();
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
    showMessage(statusContainer, `Signed in as ${user.display_name || user.unique_id}`);
  } else {
    showMessage(statusContainer, 'Not signed in. Use the form above or go to Matches once signed in.');
  }
}

export async function isCurrentUserAdmin() {
  return getCurrentUser()?.is_admin === true;
}
