import { initAuthForms, renderUserStatus, signOut } from './auth.js';

const i18n = {
  en: {
    'page.signIn': 'Sign in',
    'page.signUp': 'Sign up',
    'page.matches': 'Matches',
    'page.leaderboard': 'Leaderboard',
    'page.rules': 'Rules',
    'page.admin': 'Admin',
    'options.theme': 'Theme',
    'options.language': 'Language',
    'action.signOut': 'Sign out',
    'action.refresh': 'Refresh',
    'nav.leaderboard': 'Leaderboard',
    'nav.matches': 'Matches',
    'nav.rules': 'Rules',
    'nav.admin': 'Admin',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.signInButton': 'Sign in',
    'auth.signUpLink': 'Sign up',
    'auth.createAccount': 'Create account',
    'auth.createAccountButton': 'Create account',
    'auth.backToSignIn': 'Back to sign in',
  },
  de: {
    'page.signIn': 'Anmelden',
    'page.signUp': 'Registrieren',
    'page.matches': 'Spiele',
    'page.leaderboard': 'Tabelle',
    'page.rules': 'Regeln',
    'page.admin': 'Admin',
    'options.theme': 'Thema',
    'options.language': 'Sprache',
    'action.signOut': 'Abmelden',
    'action.refresh': 'Aktualisieren',
    'nav.leaderboard': 'Tabelle',
    'nav.matches': 'Spiele',
    'nav.rules': 'Regeln',
    'nav.admin': 'Admin',
    'auth.username': 'Benutzername',
    'auth.password': 'Passwort',
    'auth.signInButton': 'Anmelden',
    'auth.signUpLink': 'Registrieren',
    'auth.createAccount': 'Konto erstellen',
    'auth.createAccountButton': 'Konto erstellen',
    'auth.backToSignIn': 'Zurück zur Anmeldung',
  },
  es: {
    'page.signIn': 'Iniciar sesión',
    'page.signUp': 'Registrarse',
    'page.matches': 'Partidos',
    'page.leaderboard': 'Clasificación',
    'page.rules': 'Reglas',
    'page.admin': 'Admin',
    'options.theme': 'Tema',
    'options.language': 'Idioma',
    'action.signOut': 'Cerrar sesión',
    'action.refresh': 'Actualizar',
    'nav.leaderboard': 'Clasificación',
    'nav.matches': 'Partidos',
    'nav.rules': 'Reglas',
    'nav.admin': 'Admin',
    'auth.username': 'Usuario',
    'auth.password': 'Contraseña',
    'auth.signInButton': 'Iniciar sesión',
    'auth.signUpLink': 'Registrarse',
    'auth.createAccount': 'Crear cuenta',
    'auth.createAccountButton': 'Crear cuenta',
    'auth.backToSignIn': 'Volver a iniciar sesión',
  },
};

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  window.localStorage.setItem('theme', theme);
  const themeToggle = document.querySelector('#theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = theme === 'light' ? '☀ Light' : '🌙 Dark';
    themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
    themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  }
}

function translatePage(language) {
  const translations = i18n[language] || i18n.en;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (translations[key]) {
      element.textContent = translations[key];
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach((element) => {
    const key = element.dataset.i18nTitle;
    if (translations[key]) {
      element.title = translations[key];
    }
  });
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
  translatePage(savedLanguage);

  languageSelect.addEventListener('change', () => {
    const selected = languageSelect.value;
    document.documentElement.lang = selected;
    window.localStorage.setItem('language', selected);
    translatePage(selected);
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
    event.preventDefault();
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

async function initializeApp() {
  console.log('initializeApp start');
  try {
    initAuthForms();
    await renderUserStatus();
  } catch (error) {
    console.warn('Error during auth initialization:', error);
  }

  try {
    initThemeControls();
    initLanguageControls();
    initOptionsMenu();
    console.log('initOptionsMenu called');
  } catch (error) {
    console.warn('Error initializing page controls:', error);
  }

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
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

