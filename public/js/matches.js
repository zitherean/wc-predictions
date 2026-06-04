import { supabase } from './supabase-client.js';
import { formatMatchDate, showMessage } from './utils.js';
import { fetchPredictions, savePrediction } from './predictions.js';

const matchesList = document.querySelector('#matches-list');
const refreshButton = document.querySelector('#refresh-matches');
const signOutButton = document.querySelector('#sign-out');

function isKnockoutMatch(stage) {
  if (!stage) return false;

  const normalizedStage = stage.toLowerCase();

  return (
    normalizedStage.includes('last_32') ||
    normalizedStage.includes('round_of_32') ||
    normalizedStage.includes('round of 32') ||
    normalizedStage.includes('last_16') ||
    normalizedStage.includes('round_of_16') ||
    normalizedStage.includes('round of 16') ||
    normalizedStage.includes('quarter') ||
    normalizedStage.includes('semi') ||
    normalizedStage.includes('third_place') ||
    normalizedStage.includes('third place') ||
    normalizedStage.includes('final')
  );
}

function getPredictedWinnerSide(homeScore, awayScore) {
  if (homeScore > awayScore) return 'home';
  if (awayScore > homeScore) return 'away';
  return null;
}

async function fetchMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      home_team,
      away_team,
      kickoff_time,
      stage,
      status,
      home_score,
      away_score,
      winner_side
    `)
    .order('kickoff_time', { ascending: true });

  if (error) {
    renderEmpty(error.message || 'Unable to load matches.');
    return [];
  }

  return data || [];
}

function renderEmpty(text) {
  if (!matchesList) return;

  matchesList.innerHTML = `
    <div class="card empty-state">
      <p>${text}</p>
    </div>
  `;
}

function canEditMatch(match) {
  if (!match.kickoff_time) return true;

  const kickoff = new Date(match.kickoff_time).getTime();
  return Date.now() < kickoff;
}

function getDisplayStatus(match) {
  if (match.status === 'finished') return 'Finished';
  if (match.status === 'live') return 'Live';
  if (canEditMatch(match)) return 'Upcoming';
  return 'Locked';
}

function renderMatches(matches, predictions) {
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
    const status = getDisplayStatus(match);
    const locked = !canEditMatch(match);
    const prediction = predictions[match.id] || {};
    const knockout = isKnockoutMatch(match.stage);

    const selectedWinnerSide = prediction.predicted_winner_side || '';

    card.innerHTML = `
      <div class="match-header">
        <div class="match-teams">
          <strong>${match.home_team}</strong>
          <span>vs</span>
          <strong>${match.away_team}</strong>
        </div>

        <div class="match-status">
          ${status} · ${matchDate}
        </div>
      </div>

      ${
        match.stage
          ? `
            <div class="match-stage">
              <span class="muted-label">${match.stage}</span>
            </div>
          `
          : ''
      }

      ${
        match.status === 'finished'
          ? `
            <div class="match-result">
              Final result:
              <strong>${match.home_score ?? '-'} - ${match.away_score ?? '-'}</strong>
            </div>
          `
          : ''
      }

      <div class="match-body">
        <div class="match-score">
          <label>
            <span class="muted-label">${match.home_team}</span>
            <input
              type="number"
              min="0"
              step="1"
              data-match-id="${match.id}"
              data-side="home"
              value="${prediction.predicted_home_score ?? ''}"
              ${locked ? 'disabled' : ''}
            />
          </label>

          <span style="text-align:center; color: var(--muted);">-</span>

          <label>
            <span class="muted-label">${match.away_team}</span>
            <input
              type="number"
              min="0"
              step="1"
              data-match-id="${match.id}"
              data-side="away"
              value="${prediction.predicted_away_score ?? ''}"
              ${locked ? 'disabled' : ''}
            />
          </label>
        </div>
      </div>

      ${
        knockout
          ? `
            <div class="advance-selector">
              <label>
                <span class="muted-label">If tied, who advances?</span>
                <select
                  data-match-id="${match.id}"
                  data-field="predicted-winner-side"
                  ${locked ? 'disabled' : ''}
                >
                  <option value="">Select team</option>
                  <option value="home" ${selectedWinnerSide === 'home' ? 'selected' : ''}>
                    ${match.home_team}
                  </option>
                  <option value="away" ${selectedWinnerSide === 'away' ? 'selected' : ''}>
                    ${match.away_team}
                  </option>
                </select>
              </label>
            </div>
          `
          : ''
      }

      <div class="match-footer">
        <button
          class="button button-primary save-prediction"
          data-match-id="${match.id}"
          data-stage="${match.stage ?? ''}"
          ${locked ? 'disabled' : ''}
        >
          Save prediction
        </button>
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
      const stage = button.dataset.stage || '';
      const knockout = isKnockoutMatch(stage);

      const homeInput = document.querySelector(
        `input[data-match-id="${matchId}"][data-side="home"]`
      );

      const awayInput = document.querySelector(
        `input[data-match-id="${matchId}"][data-side="away"]`
      );

      const winnerSelect = document.querySelector(
        `select[data-match-id="${matchId}"][data-field="predicted-winner-side"]`
      );

      const home = homeInput?.value;
      const away = awayInput?.value;

      if (home === '' || away === '') {
        alert('Enter both scores before saving.');
        return;
      }

      const homeScore = Number(home);
      const awayScore = Number(away);

      if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
        alert('Scores must be whole numbers.');
        return;
      }

      if (homeScore < 0 || awayScore < 0) {
        alert('Scores cannot be negative.');
        return;
      }

      let predictedWinnerSide = null;

      if (knockout) {
        predictedWinnerSide = getPredictedWinnerSide(homeScore, awayScore);

        if (!predictedWinnerSide) {
          predictedWinnerSide = winnerSelect?.value || null;
        }

        if (!predictedWinnerSide) {
          alert('For a draw in the knockout phase, please select who advances.');
          return;
        }
      }

      button.textContent = 'Saving...';
      button.disabled = true;

      try {
        await savePrediction(
          matchId,
          homeScore,
          awayScore,
          predictedWinnerSide
        );

        showMessage(matchesList, 'Prediction saved successfully.', 'success');
      } catch (error) {
        showMessage(
          matchesList,
          error.message || 'Unable to save prediction.',
          'danger'
        );
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
  const matchIds = matches.map((match) => match.id).filter(Boolean);

  let predictions = {};

  try {
    predictions = await fetchPredictions(matchIds);
  } catch (error) {
    console.warn('Unable to load predictions:', error);
  }

  renderMatches(matches, predictions);
}

window.addEventListener('DOMContentLoaded', initMatchesPage);