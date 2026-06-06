const matchesListSelector = '#matches-list';
const toggleButtonId = 'toggle-archived';

function parseIsoFromElement(el) {
  if (!el) return null;

  if (el.tagName === 'TIME' && el.getAttribute('datetime')) {
    return new Date(el.getAttribute('datetime'));
  }

  if (el.dataset && el.dataset.kickoff) {
    return new Date(el.dataset.kickoff);
  }

  const iso = el.innerText.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
  return iso ? new Date(iso[0]) : null;
}

function removeArchiveEmptyMessage() {
  const existingMessage = document.querySelector('.archive-empty-message');

  if (existingMessage) {
    existingMessage.remove();
  }
}

function showArchiveEmptyMessage() {
  const list = document.querySelector(matchesListSelector);
  if (!list) return;

  removeArchiveEmptyMessage();

  const message = document.createElement('div');
  message.className = 'card empty-state archive-empty-message';

  message.innerHTML = `
    <p>Finished matches will appear here.</p>
  `;

  // Put it at the top of the match list so it is immediately visible
  list.prepend(message);
}

function hasArchivedMatches() {
  const list = document.querySelector(matchesListSelector);
  if (!list) return false;

  return list.querySelectorAll('.match-card.archived').length > 0;
}

function scanAndArchive() {
  const list = document.querySelector(matchesListSelector);
  if (!list) return;

  const cards = Array.from(list.querySelectorAll('.match-card'));
  const now = Date.now();

  cards.forEach((card) => {
    const timeEl = card.querySelector(
      'time[datetime], [data-kickoff], .kickoff, .match-kickoff, kickoff_time'
    );

    const date = timeEl ? parseIsoFromElement(timeEl) : parseIsoFromElement(card);

    if (date && date.getTime && date.getTime() < now) {
      card.classList.add('archived');
    } else {
      card.classList.remove('archived');
    }
  });
}

function setupToggle() {
  const btn = document.getElementById(toggleButtonId);
  if (!btn) return;

  function updateButtonText() {
    const showing = document.body.classList.contains('show-archived');

    btn.textContent = showing ? 'Hide match archive' : 'Show match archive';
    btn.setAttribute('aria-pressed', String(showing));
  }

  btn.addEventListener('click', () => {
    removeArchiveEmptyMessage();
    scanAndArchive();

    document.body.classList.toggle('show-archived');

    const showingArchive = document.body.classList.contains('show-archived');

    if (showingArchive && !hasArchivedMatches()) {
      showArchiveEmptyMessage();
    }

    updateButtonText();
  });

  updateButtonText();
}

function waitForMatchesAndInit() {
  const list = document.querySelector(matchesListSelector);

  if (!list) {
    setTimeout(waitForMatchesAndInit, 250);
    return;
  }

  scanAndArchive();
  setupToggle();

  const mo = new MutationObserver(() => {
    scanAndArchive();
  });

  mo.observe(list, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForMatchesAndInit);
} else {
  waitForMatchesAndInit();
}

export {};