import { supabase } from './supabase-client.js';

const leaderboardBody = document.querySelector('#leaderboard-body');

async function loadLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, display_name, unique_id, total_points, predictions_count')
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
      <td>${row.display_name}</td>
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
  loadLeaderboard();
});
