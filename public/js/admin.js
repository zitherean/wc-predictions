import { supabase } from './supabase-client.js';
import { makeLogEntry } from './utils.js';

const syncButton = document.querySelector('#sync-matches');
const calculateButton = document.querySelector('#calculate-points');
const signOutButton = document.querySelector('#sign-out');

const logOutput = document.querySelector('#admin-log');
const adminActions = document.querySelector('#admin-actions');
const accessMessage = document.querySelector('#admin-access-message');

function appendLog(message) {
  if (!logOutput) return;
  logOutput.textContent = `${logOutput.textContent}\n${makeLogEntry(message)}`;
}

function setAccessMessage(message) {
  if (!accessMessage) return;
  accessMessage.textContent = message;
}

async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

async function getCurrentProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, is_admin')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function checkAdminAccess() {
  const session = await getCurrentSession();

  if (!session?.user) {
    setAccessMessage('You must sign in first. Redirecting...');
    appendLog('No active session. Redirecting to sign in.');

    window.location.replace('matches.html');

    return false;
  }

  const profile = await getCurrentProfile(session.user.id);

  if (!profile?.is_admin) {
    setAccessMessage('Access denied. This page is only available to admins.');
    appendLog(`Access denied for ${profile?.display_name || session.user.id}.`);

    window.location.replace('matches.html');
    return false;
  }

  setAccessMessage(`Signed in as admin: ${profile.display_name}`);
  appendLog('Admin access confirmed.');


  if (adminActions) {
    adminActions.hidden = false;
  }

  return true;
}

async function callAdminEndpoint(path, button) {
  if (button) {
    button.disabled = true;
  }

  try {
    const session = await getCurrentSession();
    const token = session?.access_token;

    if (!token) {
      appendLog('Sign in first to use admin actions.');
      window.location.href = 'index.html';
      return;
    }

    appendLog(`Calling ${path}...`);

    const response = await fetch(path, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const body = await response.text();
    appendLog(`Response ${response.status}: ${body}`);
  } catch (error) {
    appendLog(`Error: ${error.message}`);
  } finally {
    if (button) {
      setTimeout(() => {
        button.disabled = false;
      }, 3000);
    }
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const isAdmin = await checkAdminAccess();

    if (!isAdmin) {
      return;
    }

    if (syncButton) {
      syncButton.addEventListener('click', () => {
        callAdminEndpoint('/api/sync-matches', syncButton);
      });
    }

    if (calculateButton) {
      calculateButton.addEventListener('click', () => {
        callAdminEndpoint('/api/calculate-points', calculateButton);
      });
    }

    if (signOutButton) {
      signOutButton.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
      });
    }
  } catch (error) {
    setAccessMessage('Unable to check admin access.');
    appendLog(`Admin check error: ${error.message}`);
  }
});
