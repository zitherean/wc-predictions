import { getCurrentUser, loadLeaderboard as loadLeaderboardData } from './data.js';

const leaderboardBody = document.querySelector('#leaderboard-body');

async function loadLeaderboard() {
  let data;
  try {
    data = await loadLeaderboardData();
  } catch (error) {
    renderFallback(error.message || 'Unable to load leaderboard.');
    return;
  }

  if (!data || data.length === 0) {
    renderFallback('No leaderboard data found yet.');
    return;
  }

  // remove any profiles that are named 'admin' (case-insensitive)
  const filtered = data.filter((row) => {
    const dn = String(row.display_name ?? '').trim().toLowerCase();
    const uid = String(row.unique_id ?? '').trim().toLowerCase();
    return dn !== 'admin' && uid !== 'admin';
  });

  if (!filtered || filtered.length === 0) {
    renderFallback('No leaderboard data found yet.');
    return;
  }

  leaderboardBody.innerHTML = '';
  const currentUserId = getCurrentUser()?.id || null;

  filtered.sort((a, b) => Number(b.total_points || 0) - Number(a.total_points || 0)).slice(0, 50).forEach((row, index) => {
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
