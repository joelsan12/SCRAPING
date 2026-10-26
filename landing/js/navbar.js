/**
 * LicitaciónYa — Navigation
 * Menú móvil, estado de scroll y cierre accesible.
 */

export function initNavbar() {
  const header = document.getElementById('site-header');
  const toggle = document.getElementById('menu-toggle');
  const links = document.getElementById('nav-links');

  if (!header) return;

  function setMenu(open) {
    if (!toggle || !links) return;
    links.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
  }

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      setMenu(!links.classList.contains('is-open'));
    });

    links.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('click', (event) => {
      if (!links.classList.contains('is-open')) return;
      if (links.contains(event.target) || toggle.contains(event.target)) return;
      setMenu(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && links.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}
