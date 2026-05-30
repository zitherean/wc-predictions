import { supabase, hasSupabaseConfig } from './supabase-client.js';

const leaderboardBody = document.querySelector('#leaderboard-body');
const refreshButton = document.querySelector('#refresh-leaderboard');

async function loadLeaderboard() {
  if (!hasSupabaseConfig) {
    renderFallback('Configure Supabase in public/js/config.js to view leaderboard data.');
    return;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, total_points')
    .order('total_points', { ascending: false })
    .limit(50);

  if (error) {
    renderFallback(error.message || 'Unable to load leaderboard.');
    return;
  }

  if (!data || data.length === 0) {
    renderFallback('No leaderboard data found yet.');
    return;
  }

  leaderboardBody.innerHTML = '';
  data.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${row.username || row.id}</td>
      <td>${row.total_points ?? 0}</td>
    `;
    leaderboardBody.appendChild(tr);
  });
}

function renderFallback(message) {
  if (!leaderboardBody) return;
  leaderboardBody.innerHTML = `<tr><td colspan="3">${message}</td></tr>`;
}

window.addEventListener('DOMContentLoaded', () => {
  if (refreshButton) {
    refreshButton.addEventListener('click', loadLeaderboard);
  }
  loadLeaderboard();
});
