/**
 * LicitaciónYa — Main Application Entry Point (ES Module)
 */

import { initNavbar } from './navbar.js?v=20261020_v3';
import { initCalculator } from './calculator.js?v=20261020_v3';
import { initFaq } from './faq.js?v=20261020_v3';
import { initInteractive } from './interactive.js?v=20261020_v4';
import { initTrialModal } from './modal.js?v=20261023_v1';

function init() {
  initNavbar();
  initCalculator();
  initFaq();
  initInteractive();
  initTrialModal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
