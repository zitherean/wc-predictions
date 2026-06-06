import { initAuthForms, renderUserStatus, signOut, isCurrentUserAdmin } from './auth.js';

const i18n = {
  en: {
    'brand.siteName': 'FIFA WC 2026 Predictions Game',
    'page.signIn': 'Sign in',
    'page.signUp': 'Sign up',
    'page.matches': 'Matches',
    'page.leaderboard': 'Leaderboard',
    'page.rules': 'Rules',
    'page.admin': 'Admin',
    'options.theme': 'Theme',
    'options.language': 'Language',
    'options.themeDarkName': 'Dark',
    'options.themeLightName': 'Light',
    'options.switchToDarkTheme': 'Switch to dark theme',
    'options.switchToLightTheme': 'Switch to light theme',
    'action.signOut': 'Sign out',
    'action.refresh': 'Refresh',
    'nav.leaderboard': 'Leaderboard',
    'nav.matches': 'Matches',
    'nav.rules': 'Rules',
    'nav.admin': 'Admin',
    'matches.predictionsHeading': 'Match Predictions',
    'matches.predictionsIntro': 'Submit your predicted scores before kickoff and save.',
    'matches.savePredictions': 'Save',
    'matches.loadingMatches': 'Loading matches...',
    'leaderboard.rank': 'Rank',
    'leaderboard.player': 'Player',
    'leaderboard.points': 'Points',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.signInButton': 'Sign in',
    'auth.signUpLink': 'Sign up',
    'auth.createAccount': 'Create account',
    'auth.createAccountButton': 'Create account',
    'auth.backToSignIn': 'Back to sign in',
    'rules.scoring': 'Scoring',
    'rules.exactScoreLabel': 'Exact score:',
    'rules.exactScoreText': '5 points.',
    'rules.correctResultLabel': 'Correct result:',
    'rules.correctResultText': '3 points for the right winner or draw.',
    'rules.knockoutBonusLabel': 'Knockout bonus:',
    'rules.knockoutBonusText': '+2 points for correctly guessing the team that advances.',
    'rules.wrongResultLabel': 'Wrong result:',
    'rules.wrongResultText': '0 points.',
    'rules.knockoutExplanation': 'Knockout matches still use the 5-3-0 scoring base, but a correct advance prediction earns an extra 2 points even when the match is decided by penalties.',
    'rules.deadlines': 'Prediction deadlines',
    'rules.deadlinesText': 'You can update predictions until kickoff time. Once the match has started, the score fields are locked.',
    'rules.matchStatus': 'Match status',
    'rules.upcomingLabel': 'Upcoming:',
    'rules.upcomingText': 'Predictions are open.',
    'rules.liveLabel': 'Live:',
    'rules.liveText': 'Match is in progress.',
    'rules.finishedLabel': 'Finished:',
    'rules.finishedText': 'Results are final.',
    'rules.fairPlay': 'Fair play',
    'rules.fairPlayText': 'This is a friendly game with no real money involved. Predict honestly and enjoy the competition.',
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
    'options.themeDarkName': 'Dunkel',
    'options.themeLightName': 'Hell',
    'options.switchToDarkTheme': 'Zum dunklen Thema wechseln',
    'options.switchToLightTheme': 'Zum hellen Thema wechseln',
    'action.signOut': 'Abmelden',
    'action.refresh': 'Aktualisieren',
    'nav.leaderboard': 'Tabelle',
    'nav.matches': 'Spiele',
    'nav.rules': 'Regeln',
    'nav.admin': 'Admin',
    'matches.predictionsHeading': 'Spieltipps',
    'matches.predictionsIntro': 'Gib deine Ergebnistipps vor dem Anpfiff ab und speichere sie.',
    'matches.savePredictions': 'Speichern',
    'matches.loadingMatches': 'Spiele werden geladen...',
    'leaderboard.rank': 'Rang',
    'leaderboard.player': 'Spieler',
    'leaderboard.points': 'Punkte',
    'auth.username': 'Benutzername',
    'auth.password': 'Passwort',
    'auth.signInButton': 'Anmelden',
    'auth.signUpLink': 'Registrieren',
    'auth.createAccount': 'Konto erstellen',
    'auth.createAccountButton': 'Konto erstellen',
    'rules.scoring': 'Punktevergabe',
    'rules.exactScoreLabel': 'Exaktes Ergebnis:',
    'rules.exactScoreText': '5 Punkte.',
    'rules.correctResultLabel': 'Richtige Tendenz:',
    'rules.correctResultText': '3 Punkte fuer den richtigen Sieger oder ein Unentschieden.',
    'rules.knockoutBonusLabel': 'K.-o.-Bonus:',
    'rules.knockoutBonusText': '+2 Punkte, wenn du richtig vorhersagst, welches Team weiterkommt.',
    'rules.wrongResultLabel': 'Falsche Tendenz:',
    'rules.wrongResultText': '0 Punkte.',
    'rules.knockoutExplanation': 'K.-o.-Spiele verwenden weiterhin die 5-3-0-Basiswertung, aber eine richtige Weiterkommen-Vorhersage bringt 2 Zusatzpunkte, auch wenn das Spiel im Elfmeterschiessen entschieden wird.',
    'rules.deadlines': 'Abgabefristen',
    'rules.deadlinesText': 'Du kannst Tipps bis zum Anpfiff aktualisieren. Sobald das Spiel begonnen hat, sind die Ergebnisfelder gesperrt.',
    'rules.matchStatus': 'Spielstatus',
    'rules.upcomingLabel': 'Bevorstehend:',
    'rules.upcomingText': 'Tipps sind offen.',
    'rules.liveLabel': 'Live:',
    'rules.liveText': 'Das Spiel laeuft.',
    'rules.finishedLabel': 'Beendet:',
    'rules.finishedText': 'Die Ergebnisse sind endgueltig.',
    'rules.fairPlay': 'Faires Spiel',
    'rules.fairPlayText': 'Dies ist ein freundschaftliches Spiel ohne echtes Geld. Tippe ehrlich und geniesse den Wettbewerb.',
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
    'options.themeDarkName': 'Oscuro',
    'options.themeLightName': 'Claro',
    'options.switchToDarkTheme': 'Cambiar al tema oscuro',
    'options.switchToLightTheme': 'Cambiar al tema claro',
    'action.signOut': 'Cerrar sesión',
    'action.refresh': 'Actualizar',
    'nav.leaderboard': 'Clasificación',
    'nav.matches': 'Partidos',
    'nav.rules': 'Reglas',
    'nav.admin': 'Admin',
    'matches.predictionsHeading': 'Predicciones de partidos',
    'matches.predictionsIntro': 'Env\u00eda tus marcadores pronosticados antes del inicio y gu\u00e1rdalos.',
    'matches.savePredictions': 'Guardar',
    'matches.loadingMatches': 'Cargando partidos...',
    'leaderboard.rank': 'Posici\u00f3n',
    'leaderboard.player': 'Jugador',
    'leaderboard.points': 'Puntos',
    'auth.username': 'Usuario',
    'auth.password': 'Contraseña',
    'auth.signInButton': 'Iniciar sesión',
    'auth.signUpLink': 'Registrarse',
    'auth.createAccount': 'Crear cuenta',
    'auth.createAccountButton': 'Crear cuenta',
    'rules.scoring': 'Puntuaci\u00f3n',
    'rules.exactScoreLabel': 'Marcador exacto:',
    'rules.exactScoreText': '5 puntos.',
    'rules.correctResultLabel': 'Resultado correcto:',
    'rules.correctResultText': '3 puntos por acertar el ganador o el empate.',
    'rules.knockoutBonusLabel': 'Bono de eliminatoria:',
    'rules.knockoutBonusText': '+2 puntos por acertar el equipo que avanza.',
    'rules.wrongResultLabel': 'Resultado incorrecto:',
    'rules.wrongResultText': '0 puntos.',
    'rules.knockoutExplanation': 'Los partidos de eliminatoria siguen usando la base de puntuaci\u00f3n 5-3-0, pero una predicci\u00f3n correcta del equipo que avanza da 2 puntos extra, incluso si el partido se decide por penaltis.',
    'rules.deadlines': 'Plazos de predicci\u00f3n',
    'rules.deadlinesText': 'Puedes actualizar tus predicciones hasta la hora de inicio. Una vez que el partido ha comenzado, los campos de marcador quedan bloqueados.',
    'rules.matchStatus': 'Estado del partido',
    'rules.upcomingLabel': 'Pr\u00f3ximo:',
    'rules.upcomingText': 'Las predicciones est\u00e1n abiertas.',
    'rules.liveLabel': 'En vivo:',
    'rules.liveText': 'El partido est\u00e1 en curso.',
    'rules.finishedLabel': 'Finalizado:',
    'rules.finishedText': 'Los resultados son definitivos.',
    'rules.fairPlay': 'Juego limpio',
    'rules.fairPlayText': 'Este es un juego amistoso sin dinero real. Predice con honestidad y disfruta la competencia.',
    'auth.backToSignIn': 'Volver a iniciar sesión',
  },
};

function getCurrentLanguage() {
  return window.localStorage.getItem('language') || document.documentElement.lang || 'en';
}

function getTranslations(language = getCurrentLanguage()) {
  return i18n[language] || i18n.en;
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  window.localStorage.setItem('theme', theme);
  const themeToggle = document.querySelector('#theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = theme === 'light' ? '🌙 Dark' : '☀️ Light';
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    updateThemeToggleText(theme);
  }
}

function updateThemeToggleText(theme = document.body.getAttribute('data-theme') || 'dark') {
  const themeToggle = document.querySelector('#theme-toggle');
  if (!themeToggle) return;

  const translations = getTranslations();
  const nextThemeName = theme === 'light' ? translations['options.themeDarkName'] : translations['options.themeLightName'];
  const nextThemeIcon = theme === 'light' ? '\u{1F319}' : '\u2600\ufe0f';
  const nextThemeLabel = theme === 'light' ? translations['options.switchToDarkTheme'] : translations['options.switchToLightTheme'];

  themeToggle.textContent = `${nextThemeIcon} ${nextThemeName}`;
  themeToggle.setAttribute('aria-label', nextThemeLabel);
}

function translatePage(language) {
  const translations = getTranslations(language);
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
  updateThemeToggleText();

  languageSelect.addEventListener('change', () => {
    const selected = languageSelect.value;
    document.documentElement.lang = selected;
    window.localStorage.setItem('language', selected);
    translatePage(selected);
    updateThemeToggleText();
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

async function toggleAdminNavVisibility() {
  const adminLinks = document.querySelectorAll('.admin-only-nav');
  if (!adminLinks.length) return;

  const isAdmin = await isCurrentUserAdmin();

  adminLinks.forEach((link) => {
    link.hidden = !isAdmin;
  });
}

async function initializeApp() {
  console.log('initializeApp start');
  try {
    initAuthForms();
    await renderUserStatus();
    await toggleAdminNavVisibility();
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
