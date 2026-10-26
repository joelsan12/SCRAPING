/**
 * LicitaciónYa — Entrada principal de la landing
 */

import { initNavbar } from './navbar.js?v=20261025_v4';
import { initCoverage } from './coverage.js?v=20261025_v4';
import { initCalculator } from './calculator.js?v=20261025_v4';
import { initTrialModal } from './modal.js?v=20261025_v4';

function initApp() {
  initNavbar();
  initCoverage();
  initCalculator();
  initTrialModal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
