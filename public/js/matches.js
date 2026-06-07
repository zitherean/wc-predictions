import { supabase } from './supabase-client.js';
import { formatMatchDate, showMessage } from './utils.js';
import { fetchPredictions, savePrediction } from './predictions.js';

const matchesList = document.querySelector('#matches-list');
const refreshButton = document.querySelector('#refresh-matches');
const savePredictionsButton = document.querySelector('#save-predictions');
let currentMatches = [];
let currentPredictions = {};

const matchI18n = {
  en: {
    locale: 'en-US',
    tbd: 'TBD',
    noMatches: 'No matches are available yet.',
    loadingMatches: 'Loading matches...',
    statusFinished: 'Finished',
    statusLive: 'Live',
    statusUpcoming: 'Upcoming',
    statusLocked: 'Locked',
    ifTiedAdvances: 'If tied, who advances?',
    selectTeam: 'Select team',
    finalResult: 'Final result:',
    advances: 'Advances:',
    chooseWinner: 'Choose a winner:',
    winnerWins: '{team} wins',
    enterBothScores: 'Enter both scores before saving predictions.',
    scoresWholeNumbers: 'Scores must be whole numbers.',
    scoresNonNegative: 'Scores cannot be negative.',
    drawRequiresAdvanceSelection: 'For a draw in the knockout phase, please select who advances.',
    noPredictionsToSave: 'No predictions to save',
    predictionsSaved: 'Predictions saved',
    unableToSavePredictions: 'Unable to save predictions.',
    saving: 'Saving...',
    stageGroupStage: 'Group stage',
    stageRoundOf32: 'Round of 32',
    stageRoundOf16: 'Round of 16',
    stageQuarterFinal: 'Quarter-final',
    stageSemiFinal: 'Semi-final',
    stageThirdPlace: 'Third place',
    stageFinal: 'Final',
    archivedMatchesHeading: 'Archived matches',
    upcomingMatchesHeading: 'Upcoming matches',
  },
  de: {
    locale: 'de-DE',
    tbd: 'Offen',
    noMatches: 'Es sind noch keine Spiele verfuegbar.',
    loadingMatches: 'Spiele werden geladen...',
    statusFinished: 'Beendet',
    statusLive: 'Live',
    statusUpcoming: 'Bevorstehend',
    statusLocked: 'Gesperrt',
    ifTiedAdvances: 'Bei Gleichstand: Wer kommt weiter?',
    selectTeam: 'Team auswaehlen',
    finalResult: 'Endergebnis:',
    advances: 'Kommt weiter:',
    chooseWinner: 'Wähle einen Gewinner:',
    winnerWins: '{team} gewinnt',
    enterBothScores: 'Gib beide Ergebnisse ein, bevor du die Vorhersagen speicherst.',
    scoresWholeNumbers: 'Ergebnisse müssen ganze Zahlen sein.',
    scoresNonNegative: 'Ergebnisse dürfen nicht negativ sein.',
    drawRequiresAdvanceSelection: 'Bei einem Unentschieden in der Knockout-Phase wähle bitte, wer weiterkommt.',
    noPredictionsToSave: 'Keine Vorhersagen zum Speichern',
    predictionsSaved: 'Vorhersagen gespeichert',
    unableToSavePredictions: 'Vorhersagen konnten nicht gespeichert werden.',
    saving: 'Speichern...',
    stageGroupStage: 'Gruppenphase',
    stageRoundOf32: 'Runde der letzten 32',
    stageRoundOf16: 'Achtelfinale',
    stageQuarterFinal: 'Viertelfinale',
    stageSemiFinal: 'Halbfinale',
    stageThirdPlace: 'Spiel um Platz 3',
    stageFinal: 'Finale',
    archivedMatchesHeading: 'Archivierte Spiele',
    upcomingMatchesHeading: 'Bevorstehende Spiele',
  },
  es: {
    locale: 'es-ES',
    tbd: 'Por definir',
    noMatches: 'Todav\u00eda no hay partidos disponibles.',
    loadingMatches: 'Cargando partidos...',
    statusFinished: 'Finalizado',
    statusLive: 'En vivo',
    statusUpcoming: 'Pr\u00f3ximo',
    statusLocked: 'Bloqueado',
    ifTiedAdvances: 'Si hay empate, \u00bfqui\u00e9n avanza?',
    selectTeam: 'Seleccionar equipo',
    finalResult: 'Resultado final:',
    advances: 'Avanza:',
    chooseWinner: 'Elige un ganador:',
    winnerWins: '{team} gana',
    enterBothScores: 'Introduce ambos resultados antes de guardar las predicciones.',
    scoresWholeNumbers: 'Los resultados deben ser números enteros.',
    scoresNonNegative: 'Los resultados no pueden ser negativos.',
    drawRequiresAdvanceSelection: 'Para un empate en la fase eliminatoria, selecciona quién avanza.',
    noPredictionsToSave: 'No hay predicciones para guardar',
    predictionsSaved: 'Predicciones guardadas',
    unableToSavePredictions: 'No se pudieron guardar las predicciones.',
    saving: 'Guardando...',
    stageGroupStage: 'Fase de grupos',
    stageRoundOf32: 'Dieciseisavos de final',
    stageRoundOf16: 'Octavos de final',
    stageQuarterFinal: 'Cuartos de final',
    stageSemiFinal: 'Semifinal',
    stageThirdPlace: 'Tercer puesto',
    stageFinal: 'Final',
    archivedMatchesHeading: 'Partidos archivados',
    upcomingMatchesHeading: 'Próximos partidos',
  },
};

// show a small transient message next to the save button (does not replace page content)
function showTransientMessageNear(button, message, duration = 2200) {
  if (!button || !button.parentElement) return;
  // remove any existing
  const existing = button.parentElement.querySelector('.save-feedback');
  if (existing) existing.remove();
  const span = document.createElement('span');
  span.className = 'save-feedback';
  span.textContent = message;
  button.parentElement.appendChild(span);
  // fade out and remove after duration
  setTimeout(() => {
    span.style.transition = 'opacity 300ms ease';
    span.style.opacity = '0';
    setTimeout(() => span.remove(), 320);
  }, duration);
}
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

const countryFlagMap = {
  argentina: '🇦🇷',
  australia: '🇦🇺',
  austria: '🇦🇹',
  belgium: '🇧🇪',
  brazil: '🇧🇷',
  cameroon: '🇨🇲',
  canada: '🇨🇦',
  'cape verde': '🇨🇻',
  chile: '🇨🇱',
  colombia: '🇨🇴',
  'costa rica': '🇨🇷',
  croatia: '🇭🇷',
  'czech republic': '🇨🇿',
  czechia: '🇨🇿',
  denmark: '🇩🇰',
  ecuador: '🇪🇨',
  egypt: '🇪🇬',
  england: '🇬🇧',
  france: '🇫🇷',
  germany: '🇩🇪',
  ghana: '🇬🇭',
  'ivory coast': '🇨🇮',
  'cote d ivoire': '🇨🇮',
  iran: '🇮🇷',
  italy: '🇮🇹',
  japan: '🇯🇵',
  mexico: '🇲🇽',
  morocco: '🇲🇦',
  netherlands: '🇳🇱',
  'new zealand': '🇳🇿',
  niger: '🇳🇪',
  nigeria: '🇳🇬',
  panama: '🇵🇦',
  paraguay: '🇵🇾',
  peru: '🇵🇪',
  poland: '🇵🇱',
  portugal: '🇵🇹',
  qatar: '🇶🇦',
  'saudi arabia': '🇸🇦',
  senegal: '🇸🇳',
  serbia: '🇷🇸',
  'south africa': '🇿🇦',
  'south korea': '🇰🇷',
  spain: '🇪🇸',
  sweden: '🇸🇪',
  switzerland: '🇨🇭',
  tunisia: '🇹🇳',
  uruguay: '🇺🇾',
  'united states': '🇺🇸',
  usa: '🇺🇸',
  wales: '🇬🇧',
  venezuela: '🇻🇪',
  curacao: '🇨🇼',
  algeria: '🇩🇿'
};

const countryCodeMap = {
  argentina: 'AR',
  australia: 'AU',
  austria: 'AT',
  belgium: 'BE',
  brazil: 'BR',
  cameroon: 'CM',
  canada: 'CA',
  'cape verde': 'CV',
  chile: 'CL',
  colombia: 'CO',
  'costa rica': 'CR',
  croatia: 'HR',
  'czech republic': 'CZ',
  czechia: 'CZ',
  denmark: 'DK',
  ecuador: 'EC',
  egypt: 'EG',
  england: 'GB',
  france: 'FR',
  germany: 'DE',
  ghana: 'GH',
  'ivory coast': 'CI',
  'cote d ivoire': 'CI',
  iran: 'IR',
  italy: 'IT',
  japan: 'JP',
  mexico: 'MX',
  morocco: 'MA',
  netherlands: 'NL',
  'new zealand': 'NZ',
  niger: 'NE',
  nigeria: 'NG',
  panama: 'PA',
  paraguay: 'PY',
  peru: 'PE',
  poland: 'PL',
  portugal: 'PT',
  qatar: 'QA',
  'saudi arabia': 'SA',
  senegal: 'SN',
  serbia: 'RS',
  'south africa': 'ZA',
  'south korea': 'KR',
  spain: 'ES',
  sweden: 'SE',
  switzerland: 'CH',
  tunisia: 'TN',
  uruguay: 'UY',
  'united states': 'US',
  usa: 'US',
  wales: 'GB',
  venezuela: 'VE',
  curacao: 'CW',
  algeria: 'DZ',
};

const footballRegionNames = {
  en: {
    england: 'England',
    wales: 'Wales',
    'united states': 'United States',
    usa: 'United States',
  },
  de: {
    england: 'England',
    wales: 'Wales',
    'united states': 'Vereinigte Staaten',
    usa: 'Vereinigte Staaten',
  },
  es: {
    england: 'Inglaterra',
    wales: 'Gales',
    'united states': 'Estados Unidos',
    usa: 'Estados Unidos',
  },
};

function getCurrentLanguage() {
  return document.querySelector('#language-select')?.value
    || window.localStorage.getItem('language')
    || document.documentElement.lang
    || 'en';
}

function getMatchTranslations() {
  return matchI18n[getCurrentLanguage()] || matchI18n.en;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeTeamName(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[’'`]/g, '')
    .replace(/[-]/g, (c) => c)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTeamFlag(name) {
  if (!name) return '';
  const normalized = normalizeTeamName(name);
  return countryFlagMap[normalized] || '';
}

function getDisplayTeamName(name) {
  if (!name) return getMatchTranslations().tbd;

  const language = getCurrentLanguage();
  const translations = getMatchTranslations();
  const normalized = normalizeTeamName(name);
  const override = footballRegionNames[language]?.[normalized] || footballRegionNames[language]?.[name.toLowerCase()];
  if (override) return override;

  const countryCode = countryCodeMap[normalized];
  if (!countryCode || typeof Intl.DisplayNames !== 'function') {
    return name;
  }

  try {
    const displayNames = new Intl.DisplayNames([translations.locale], { type: 'region' });
    return displayNames.of(countryCode) || name;
  } catch (error) {
    return name;
  }
}

function getStageKey(stage) {
  if (!stage) return null;
  const normalized = stage.toLowerCase().replace(/[_-]+/g, ' ');

  if (normalized.includes('group')) return 'stageGroupStage';
  if (normalized.includes('last 32') || normalized.includes('round of 32')) return 'stageRoundOf32';
  if (normalized.includes('last 16') || normalized.includes('round of 16')) return 'stageRoundOf16';
  if (normalized.includes('quarter')) return 'stageQuarterFinal';
  if (normalized.includes('semi')) return 'stageSemiFinal';
  if (normalized.includes('third place')) return 'stageThirdPlace';
  if (normalized.includes('final')) return 'stageFinal';
  return null;
}

function getDisplayStage(stage) {
  const key = getStageKey(stage);
  return key ? getMatchTranslations()[key] || stage : stage;
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
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}

function canEditMatch(match) {
  if (!match.kickoff_time) return true;

  const kickoff = new Date(match.kickoff_time).getTime();
  return Date.now() < kickoff;
}

function getDisplayStatus(match) {
  const translations = getMatchTranslations();
  if (match.status === 'finished') return translations.statusFinished;
  if (match.status === 'live') return translations.statusLive;
  if (canEditMatch(match)) return translations.statusUpcoming;
  return translations.statusLocked;
}

function createMatchSection(title, isArchived = false) {
  const section = document.createElement('div');
  section.className = `match-section${isArchived ? ' archived-section' : ''}`;
  const heading = document.createElement('h2');
  heading.className = 'match-section-title';
  heading.textContent = title;
  section.appendChild(heading);
  return section;
}

function renderMatchCards(container, matches, predictions) {
  const renderedStages = new Set();

  matches.forEach((match) => {
    const card = document.createElement('article');
    card.className = 'card match-card';
    card.dataset.stage = match.stage ?? '';
    card.dataset.matchId = match.id;
    card.dataset.kickoff = match.kickoff_time;

    const translations = getMatchTranslations();
    const matchDate = formatMatchDate(match.kickoff_time, translations.locale, translations.tbd);
    const status = getDisplayStatus(match);
    const locked = !canEditMatch(match);
    const prediction = predictions[match.id] || {};
    const knockout = isKnockoutMatch(match.stage);
    const predictionIsDraw = isPredictedDraw(prediction);
    const isUpcomingMatch = canEditMatch(match);
    const stageKey = String(match.stage ?? '').toLowerCase().replace(/[_\s-]+/g, ' ').trim();
    const shouldRenderStageHeading = match.stage && !renderedStages.has(stageKey);
    const homeTeamName = getDisplayTeamName(match.home_team);
    const awayTeamName = getDisplayTeamName(match.away_team);
    const advancingTeamName = match.winner_side === 'home'
      ? homeTeamName
      : match.winner_side === 'away'
        ? awayTeamName
        : '';
    const tiedWithAdvancingTeam = knockout
      && match.status === 'finished'
      && match.home_score === match.away_score
      && advancingTeamName;

    if (shouldRenderStageHeading) {
      const stageHeading = document.createElement('h3');
      stageHeading.className = 'match-stage-title';
      stageHeading.textContent = getDisplayStage(match.stage);
      container.appendChild(stageHeading);
      renderedStages.add(stageKey);
    }

    const selectedWinnerSide = prediction.predicted_winner_side || '';

    card.innerHTML = `
      <div class="match-header">
        <div class="match-status">
          ${status} · <time datetime="${match.kickoff_time}">${matchDate}</time>
        </div>
      </div>

      <div class="match-body">
        <div class="match-score">
          <label class="team-score-field">
            <span class="team-info">
              <span class="team-flag">${escapeHtml(getTeamFlag(match.home_team))}</span>
              <span class="team-name">${escapeHtml(homeTeamName)}</span>
            </span>
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

          <label class="team-score-field">
            <span class="team-info">
              <span class="team-flag">${escapeHtml(getTeamFlag(match.away_team))}</span>
              <span class="team-name">${escapeHtml(awayTeamName)}</span>
            </span>
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
            <div class="advance-selector" ${predictionIsDraw ? '' : 'hidden'}>
              <label>
                <span class="muted-label">${escapeHtml(translations.chooseWinner)}</span>
                <select
                  class="advance-select ${selectedWinnerSide ? 'has-selection' : ''}"
                  data-match-id="${match.id}"
                  data-field="predicted-winner-side"
                  ${locked ? 'disabled' : ''}
                >
                  <option value="">${escapeHtml(translations.selectTeam)}</option>
                  <option value="home" ${selectedWinnerSide === 'home' ? 'selected' : ''}>
                    ${escapeHtml(homeTeamName)}
                  </option>
                  <option value="away" ${selectedWinnerSide === 'away' ? 'selected' : ''}>
                    ${escapeHtml(awayTeamName)}
                  </option>
                </select>
              </label>
            </div>
          `
          : ''
      }
      ${formatFinalResult(match)}
    `;

    container.appendChild(card);
  });
}

function renderMatches(matches, predictions) {
  if (!matchesList) return;

  if (!matches || matches.length === 0) {
    renderEmpty(getMatchTranslations().noMatches);
    return;
  }

  const translations = getMatchTranslations();
  const now = Date.now();
  const archivedMatches = [];
  const upcomingMatches = [];

  matches.forEach((match) => {
    const kickoff = match.kickoff_time ? Date.parse(match.kickoff_time) : NaN;
    if (!Number.isNaN(kickoff) && kickoff < now) {
      archivedMatches.push(match);
    } else {
      upcomingMatches.push(match);
    }
  });

  matchesList.innerHTML = '';

  if (archivedMatches.length > 0) {
    const archivedSection = createMatchSection(translations.archivedMatchesHeading, true);
    renderMatchCards(archivedSection, archivedMatches, predictions);
    matchesList.appendChild(archivedSection);
  }

  if (upcomingMatches.length > 0) {
    const upcomingSection = createMatchSection(translations.upcomingMatchesHeading);
    renderMatchCards(upcomingSection, upcomingMatches, predictions);
    matchesList.appendChild(upcomingSection);
  }
}

function isPredictedDraw(prediction) {
  const homeScore = prediction.predicted_home_score;
  const awayScore = prediction.predicted_away_score;

  if (homeScore === null || homeScore === undefined || homeScore === '') return false;
  if (awayScore === null || awayScore === undefined || awayScore === '') return false;

  return Number(homeScore) === Number(awayScore);
}

function formatFinalResult(match) {
  const translations = getMatchTranslations();
  const hasScore =
    match.home_score !== null &&
    match.home_score !== undefined &&
    match.away_score !== null &&
    match.away_score !== undefined;

  if (!hasScore) return '';

  const isDraw = match.home_score === match.away_score;
  const isKnockout = isKnockoutMatch(match.stage);

  let advancesText = '';

  if (isKnockout && isDraw && match.winner_side !== 'draw') {
    const winnerName =
      match.winner_side === 'home'
        ? match.home_team
        : match.winner_side === 'away'
          ? match.away_team
          : null;

    if (winnerName) {
      advancesText = ` <span class="advances-result">(${translations.winnerWins.replace('{team}', escapeHtml(winnerName))})</span>`;
    }
  }

  return `
    <p class="final-result">
      ${escapeHtml(translations.finalResult)} ${match.home_score}-${match.away_score}${advancesText}
    </p>
  `;
}

function captureDraftPredictions() {
  document.querySelectorAll('.match-card').forEach((card) => {
    const matchId = card.dataset.matchId;
    if (!matchId) return;

    const homeInput = card.querySelector('input[data-side="home"]');
    const awayInput = card.querySelector('input[data-side="away"]');
    const winnerSelect = card.querySelector('select[data-field="predicted-winner-side"]');

    currentPredictions[matchId] = {
      ...(currentPredictions[matchId] || {}),
      predicted_home_score: homeInput?.value ?? '',
      predicted_away_score: awayInput?.value ?? '',
      predicted_winner_side: winnerSelect?.value || null,
    };
  });
}

async function saveAllPredictions() {
  if (!savePredictionsButton) return;

  const translations = getMatchTranslations();
  const cards = document.querySelectorAll('.match-card');
  const predictionsToSave = [];

  for (const card of cards) {
    const matchId = card.dataset.matchId;
    const stage = card.dataset.stage || '';
    const knockout = isKnockoutMatch(stage);
    const homeInput = card.querySelector('input[data-side="home"]');
    const awayInput = card.querySelector('input[data-side="away"]');
    const winnerSelect = card.querySelector('select[data-field="predicted-winner-side"]');

    if (!homeInput || !awayInput || homeInput.disabled || awayInput.disabled) {
      continue;
    }

    const home = homeInput.value;
    const away = awayInput.value;

    if (home === '' && away === '') {
      continue;
    }

    if (home === '' || away === '') {
      alert(translations.enterBothScores);
      return;
    }

    const homeScore = Number(home);
    const awayScore = Number(away);

    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
      alert(translations.scoresWholeNumbers);
      return;
    }

    if (homeScore < 0 || awayScore < 0) {
      alert(translations.scoresNonNegative);
      return;
    }

    let predictedWinnerSide = null;

    if (knockout) {
      predictedWinnerSide = getPredictedWinnerSide(homeScore, awayScore);

      if (!predictedWinnerSide) {
        predictedWinnerSide = winnerSelect?.value || null;
      }

      if (!predictedWinnerSide) {
        alert(translations.drawRequiresAdvanceSelection);
        return;
      }
    }

    predictionsToSave.push({
      matchId,
      homeScore,
      awayScore,
      predictedWinnerSide
    });
  }

  if (predictionsToSave.length === 0) {
    showTransientMessageNear(savePredictionsButton, translations.noPredictionsToSave, 2200);
    return;
  }

  const originalText = savePredictionsButton.textContent;
  savePredictionsButton.textContent = translations.saving;
  savePredictionsButton.disabled = true;

  try {
    for (const prediction of predictionsToSave) {
      await savePrediction(
        prediction.matchId,
        prediction.homeScore,
        prediction.awayScore,
        prediction.predictedWinnerSide
      );
    }

    // show a small transient confirmation next to the Save button
    showTransientMessageNear(savePredictionsButton, translations.predictionsSaved, 2200);
  } catch (error) {
    showTransientMessageNear(
      savePredictionsButton,
      error.message || translations.unableToSavePredictions,
      2200
    );
  } finally {
    savePredictionsButton.textContent = originalText;
    savePredictionsButton.disabled = false;
  }
}

async function initMatchesPage() {
  if (refreshButton) {
    refreshButton.addEventListener('click', () => loadAndRenderMatches());
  }

  if (savePredictionsButton) {
    savePredictionsButton.addEventListener('click', saveAllPredictions);
  }

  if (signOutButton) {
    signOutButton.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = 'index.html';
    });
  }

  const languageSelect = document.querySelector('#language-select');
  if (languageSelect) {
    languageSelect.addEventListener('change', () => {
      captureDraftPredictions();
      renderMatches(currentMatches, currentPredictions);
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

  currentMatches = matches;
  currentPredictions = predictions;
  renderMatches(matches, predictions);
}

if (matchesList) {
  matchesList.addEventListener('input', (event) => {
    const input = event.target;

    if (input.dataset.side !== 'home' && input.dataset.side !== 'away') return;

    const matchId = input.dataset.matchId;
    const card = input.closest('.match-card');
    if (!card) return;

    const homeInput = card.querySelector(
      `input[data-match-id="${matchId}"][data-side="home"]`
    );

    const awayInput = card.querySelector(
      `input[data-match-id="${matchId}"][data-side="away"]`
    );

    const advanceSelector = card.querySelector('.advance-selector');

    if (!homeInput || !awayInput || !advanceSelector) return;

    const homeScore = homeInput.value;
    const awayScore = awayInput.value;

    const hasBothScores = homeScore !== '' && awayScore !== '';
    const isDraw = hasBothScores && Number(homeScore) === Number(awayScore);

    advanceSelector.hidden = !isDraw;

    if (!isDraw) {
      const winnerSelect = advanceSelector.querySelector(
        'select[data-field="predicted-winner-side"]'
      );

      if (winnerSelect) {
        winnerSelect.value = '';
        winnerSelect.classList.remove('has-selection');
      }
    }
  });
}

if (matchesList) {
  matchesList.addEventListener('change', (event) => {
    const select = event.target;

    if (select.dataset.field !== 'predicted-winner-side') return;

    select.classList.toggle('has-selection', select.value !== '');
  });
}

window.addEventListener('DOMContentLoaded', initMatchesPage);