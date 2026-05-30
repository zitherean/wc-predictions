const {
  data: { user },
  error: userError
} = await supabase.auth.getUser();

console.log("Current user:", user);
console.log("User error:", userError);

import { supabase } from "./supabase-client.js";

async function loadMatches() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  console.log("Current user:", user);

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_time", { ascending: true });

  if (error) {
    console.error("Error loading matches:", error);
    return;
  }

  console.log("Matches:", data);
}

loadMatches();import { supabase, hasSupabaseConfig } from './supabase-client.js';
import { formatMatchDate, showMessage } from './utils.js';
import { fetchPredictions, savePrediction } from './predictions.js';

const matchesList = document.querySelector('#matches-list');
const refreshButton = document.querySelector('#refresh-matches');
const signOutButton = document.querySelector('#sign-out');

async function fetchMatches() {
  if (!hasSupabaseConfig) {
    renderEmpty('Configure Supabase in public/js/config.js to view match data.');
    return [];
  }

  const { data, error } = await supabase
    .from('matches')
    .select('id, home_team, away_team, kickoff_time, status, home_score, away_score')
    .order('kickoff_time', { ascending: true });

  if (error) {
    renderEmpty(error.message || 'Unable to load matches.');
    return [];
  }

  return data || [];
}

function renderEmpty(text) {
  if (!matchesList) return;
  matchesList.innerHTML = `<div class="card empty-state"><p>${text}</p></div>`;
}

function canEditMatch(match) {
  if (!match.kickoff_time) return true;
  const kickoff = new Date(match.kickoff_time).getTime();
  return Date.now() < kickoff;
}

function renderMatches(matches) {
  if (!matchesList) return;
  if (!matches || matches.length === 0) {
    renderEmpty('No matches are available yet.');
    return;
  }

  matchesList.innerHTML = '';
  matches.forEach((match) => {
    const card = document.createElement('article');
    card.className = 'card match-card';

    const matchDate = formatMatchDate(match.kickoff_time);
    const status = match.status || (canEditMatch(match) ? 'Upcoming' : 'Finished');
    const locked = !canEditMatch(match);

    card.innerHTML = `
      <div class="match-header">
        <div class="match-teams">
          <strong>${match.home_team}</strong>
          <span>vs</span>
          <strong>${match.away_team}</strong>
        </div>
        <div class="match-status">${status} · ${matchDate}</div>
      </div>
      <div class="match-body">
        <div class="match-score">
          <label>
            <span class="muted-label">${match.home_team}</span>
            <input type="number" min="0" step="1" data-match-id="${match.id}" data-side="home" value="${match.home_score ?? ''}" ${locked ? 'disabled' : ''} />
          </label>
          <span style="text-align:center; color: var(--muted);">-</span>
          <label>
            <span class="muted-label">${match.away_team}</span>
            <input type="number" min="0" step="1" data-match-id="${match.id}" data-side="away" value="${match.away_score ?? ''}" ${locked ? 'disabled' : ''} />
          </label>
        </div>
      </div>
      <div class="match-footer">
        <button class="button button-primary save-prediction" data-match-id="${match.id}" ${locked ? 'disabled' : ''}>Save prediction</button>
      </div>
    `;

    matchesList.appendChild(card);
  });

  attachSaveHandlers();
}

function attachSaveHandlers() {
  const buttons = document.querySelectorAll('.save-prediction');
  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const matchId = button.dataset.matchId;
      const inputs = document.querySelectorAll(`input[data-match-id="${matchId}"]`);
      const [homeInput, awayInput] = Array.from(inputs);
      const home = homeInput?.value;
      const away = awayInput?.value;
      if (home === '' || away === '') {
        alert('Enter both scores before saving.');
        return;
      }

      button.textContent = 'Saving...';
      button.disabled = true;

      try {
        await savePrediction(matchId, Number(home), Number(away));
        showMessage(matchesList, 'Prediction saved successfully.', 'success');
      } catch (error) {
        showMessage(matchesList, error.message || 'Unable to save prediction.', 'danger');
      } finally {
        button.textContent = 'Save prediction';
        button.disabled = false;
      }
    });
  });
}

async function initMatchesPage() {
  if (refreshButton) {
    refreshButton.addEventListener('click', () => loadAndRenderMatches());
  }
  if (signOutButton) {
    signOutButton.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = 'index.html';
    });
  }
  await loadAndRenderMatches();
}

async function loadAndRenderMatches() {
  const matches = await fetchMatches();
  renderMatches(matches);
}

window.addEventListener('DOMContentLoaded', initMatchesPage);
