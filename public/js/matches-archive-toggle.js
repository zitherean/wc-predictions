const matchesListSelector = '#matches-list';
const toggleButtonId = 'toggle-archived';

function parseIsoFromElement(el) {
  if (!el) return null;
  // prefer datetime attribute on <time>
  if (el.tagName === 'TIME' && el.getAttribute('datetime')) {
    return new Date(el.getAttribute('datetime'));
  }
  // any data-kickoff attribute
  if (el.dataset && el.dataset.kickoff) {
    return new Date(el.dataset.kickoff);
  }
  // try to find an ISO timestamp inside element text
  const iso = el.innerText.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
  return iso ? new Date(iso[0]) : null;
}

function scanAndArchive() {
  const list = document.querySelector(matchesListSelector);
  if (!list) return;
  const cards = Array.from(list.querySelectorAll('.card'));
  const now = Date.now();

  cards.forEach((card) => {
    if (card.classList.contains('empty-state')) return;

    // find likely time element
    const timeEl = card.querySelector('time[datetime], [data-kickoff], .kickoff, .match-kickoff, kickoff_time');
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
    document.body.classList.toggle('show-archived');
    updateButtonText();
  });

  updateButtonText();
}

function waitForMatchesAndInit() {
  const list = document.querySelector(matchesListSelector);
  if (!list) {
    // try again later
    setTimeout(waitForMatchesAndInit, 250);
    return;
  }

  // initial scan
  scanAndArchive();
  setupToggle();

  // observe list for newly added match cards
  const mo = new MutationObserver(() => scanAndArchive());
  mo.observe(list, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForMatchesAndInit);
} else {
  waitForMatchesAndInit();
}

export {};
