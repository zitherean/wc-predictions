import { getCurrentUser } from './data.js';
import { signOut } from './auth.js';
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

async function checkAdminAccess() {
  const user = getCurrentUser();

  if (!user) {
    setAccessMessage('You must sign in first. Redirecting...');
    appendLog('No active session. Redirecting to sign in.');

    window.location.replace('index.html');

    return false;
  }

  if (!user.is_admin) {
    setAccessMessage('Access denied. This page is only available to admins.');
    appendLog(`Access denied for ${user.display_name || user.id}.`);

    window.location.replace('index.html');
    return false;
  }

  setAccessMessage(`Signed in as admin: ${user.display_name}`);
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
    appendLog(`${path} is unavailable in static mode. Replace the JSON snapshot files to publish updated data.`);
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
        callAdminEndpoint('Match sync', syncButton);
      });
    }

    if (calculateButton) {
      calculateButton.addEventListener('click', () => {
        callAdminEndpoint('Point calculation', calculateButton);
      });
    }

    if (signOutButton) {
      signOutButton.addEventListener('click', async () => {
        await signOut();
        window.location.href = 'index.html';
      });
    }
  } catch (error) {
    setAccessMessage('Unable to check admin access.');
    appendLog(`Admin check error: ${error.message}`);
  }
});
