import { supabase } from './supabase-client.js';

const leaderboardBody = document.querySelector('#leaderboard-body');

async function loadLeaderboard() {
  // get current user session so we can highlight their row
  const { data: sessionData } = await supabase.auth.getSession();
  const currentUserId = sessionData?.session?.user?.id || null;

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

    // Rank
    const rankTd = document.createElement('td');
    rankTd.textContent = String(index + 1);

    // Player name (bold for current user)
    const nameTd = document.createElement('td');
    const displayName = row.display_name || row.unique_id || 'Anonymous';
    if (row.id && currentUserId && row.id === currentUserId) {
      tr.classList.add('current-user');
      tr.setAttribute('aria-current', 'true');
      const strong = document.createElement('strong');
      strong.textContent = displayName;
      nameTd.appendChild(strong);
    } else {
      nameTd.textContent = displayName;
    }

    // Points
    const pointsTd = document.createElement('td');
    pointsTd.textContent = String(row.total_points ?? 0);

    tr.appendChild(rankTd);
    tr.appendChild(nameTd);
    tr.appendChild(pointsTd);

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
