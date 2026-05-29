import { initAuthForms, renderUserStatus, signOut } from './auth.js';

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  window.localStorage.setItem('theme', theme);
  const themeToggle = document.querySelector('#theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = theme === 'light' ? 'Light' : 'Dark';
    themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
  }
}

function initThemeControls() {
  const themeToggle = document.querySelector('#theme-toggle');
  if (!themeToggle) return;

  const savedTheme = window.localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  });
}

function initLanguageControls() {
  const languageSelect = document.querySelector('#language-select');
  if (!languageSelect) return;

  const savedLanguage = window.localStorage.getItem('language') || 'en';
  languageSelect.value = savedLanguage;
  document.documentElement.lang = savedLanguage;

  languageSelect.addEventListener('change', () => {
    const selected = languageSelect.value;
    document.documentElement.lang = selected;
    window.localStorage.setItem('language', selected);
  });
}

function initOptionsMenu() {
  const optionsToggle = document.querySelector('.options-toggle');
  const optionsMenu = document.querySelector('.options-menu');
  const signOutQuick = document.querySelector('#sign-out-quick');

  if (!optionsToggle || !optionsMenu) {
    console.warn('Options menu elements not found');
    return;
  }

  const closeMenu = () => {
    console.log('Closing menu');
    optionsMenu.hidden = true;
    optionsToggle.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    console.log('Opening menu');
    optionsMenu.hidden = false;
    optionsToggle.setAttribute('aria-expanded', 'true');
  };

  optionsToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    console.log('Options toggle clicked, menu.hidden =', optionsMenu.hidden);
    if (optionsMenu.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  document.addEventListener('click', (event) => {
    if (!optionsMenu.contains(event.target) && !optionsToggle.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });

  if (signOutQuick) {
    signOutQuick.addEventListener('click', async () => {
      await signOut();
      window.location.href = 'index.html';
    });
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded fired');
  initAuthForms();
  await renderUserStatus();
  initThemeControls();
  initLanguageControls();
  console.log('About to call initOptionsMenu');
  initOptionsMenu();
  console.log('initOptionsMenu called');

  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      siteNav.classList.toggle('open');
    });

    siteNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
});
