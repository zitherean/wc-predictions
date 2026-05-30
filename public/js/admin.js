import { supabase, hasSupabaseConfig } from './supabase-client.js';
import { makeLogEntry } from './utils.js';

const syncButton = document.querySelector('#sync-matches');
const calculateButton = document.querySelector('#calculate-points');
const logOutput = document.querySelector('#admin-log');
const signOutButton = document.querySelector('#sign-out');

function appendLog(message) {
  if (!logOutput) return;
  logOutput.textContent = `${logOutput.textContent}\n${makeLogEntry(message)}`;
}

async function callAdminEndpoint(path) {
  if (!hasSupabaseConfig) {
    appendLog('Supabase config is missing.');
    return;
  }

  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) {
    appendLog('Sign in first to use admin actions.');
    window.location.href = 'index.html';
    return;
  }

  appendLog(`Calling ${path}...`);
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const body = await response.text();
    appendLog(`Response ${response.status}: ${body}`);
  } catch (error) {
    appendLog(`Error: ${error.message}`);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (syncButton) {
    syncButton.addEventListener('click', () => callAdminEndpoint('/api/sync-matches'));
  }
  if (calculateButton) {
    calculateButton.addEventListener('click', () => callAdminEndpoint('/api/calculate-points'));
  }
  if (signOutButton) {
    signOutButton.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = 'index.html';
    });
  }
});
