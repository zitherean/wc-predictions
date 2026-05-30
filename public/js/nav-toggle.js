document.addEventListener('DOMContentLoaded', () => {
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

  const optionsToggle = document.querySelector('.options-toggle');
  const optionsMenu = document.querySelector('.options-menu');
  if (optionsToggle && optionsMenu) {
    const closeMenu = () => {
      optionsMenu.hidden = true;
      optionsToggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
      optionsMenu.hidden = false;
      optionsToggle.setAttribute('aria-expanded', 'true');
    };

    optionsToggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
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
  }
});
