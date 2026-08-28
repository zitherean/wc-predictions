const tableCache = new Map();
const sessionKey = 'wc-predictions-session';
const accountsKey = 'wc-predictions-accounts';
const predictionsKey = 'wc-predictions-predictions';

async function loadTable(table) {
  if (!tableCache.has(table)) {
    const response = await fetch(`/data/${table}.json`);
    if (!response.ok) throw new Error(`Unable to load ${table} data.`);
    tableCache.set(table, response.json());
  }
  return tableCache.get(table);
}

export const loadMatches = () => loadTable('matches');
export const loadProfiles = () => loadTable('profiles');
export const loadLeaderboard = () => loadTable('leaderboard');
export const loadSnapshotPredictions = () => loadTable('predictions');

function readJson(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCurrentUser() {
  return readJson(sessionKey, null);
}

export function setCurrentUser(user) {
  writeJson(sessionKey, user);
}

export function clearCurrentUser() {
  window.localStorage.removeItem(sessionKey);
}

export function getLocalAccounts() {
  return readJson(accountsKey, []);
}

export function saveLocalAccount(account) {
  const accounts = getLocalAccounts().filter((item) => item.unique_id !== account.unique_id);
  accounts.push(account);
  writeJson(accountsKey, accounts);
}

export function getSavedPredictions(userId) {
  const allPredictions = readJson(predictionsKey, {});
  return allPredictions[userId] || {};
}

export function saveUserPrediction(userId, prediction) {
  const allPredictions = readJson(predictionsKey, {});
  allPredictions[userId] = allPredictions[userId] || {};
  allPredictions[userId][prediction.match_id] = prediction;
  writeJson(predictionsKey, allPredictions);
}