const matchesListSelector = '#matches-list';
const toggleButtonId = 'toggle-archived';

const archiveToggleI18n = {
  en: {
    showArchiveButton: 'Show match archive',
    hideArchiveButton: 'Hide match archive',
    archiveEmptyMessage: 'Finished matches will appear here.',
  },
  de: {
    showArchiveButton: 'Archivierte Spiele anzeigen',
    hideArchiveButton: 'Archiv verbergen',
    archiveEmptyMessage: 'Beendete Spiele werden hier angezeigt.',
  },
  es: {
    showArchiveButton: 'Mostrar archivo de partidos',
    hideArchiveButton: 'Ocultar archivo de partidos',
    archiveEmptyMessage: 'Los partidos finalizados aparecerán aquí.',
  },
};

function getCurrentLanguage() {
  return document.querySelector('#language-select')?.value
    || window.localStorage.getItem('language')
    || document.documentElement.lang
    || 'en';
}

function getArchiveToggleTranslations() {
  return archiveToggleI18n[getCurrentLanguage()] || archiveToggleI18n.en;
}

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

  const translations = getArchiveToggleTranslations();
  const message = document.createElement('div');
  message.className = 'card empty-state archive-empty-message';

  const paragraph = document.createElement('p');
  paragraph.textContent = translations.archiveEmptyMessage;
  message.appendChild(paragraph);

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
    const translations = getArchiveToggleTranslations();

    btn.textContent = showing ? translations.hideArchiveButton : translations.showArchiveButton;
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