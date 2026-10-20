/**
 * LicitaciónYa — Main Application Entry Point (ES Module)
 */

import { initNavbar } from './navbar.js';
import { initCalculator } from './calculator.js';
import { initFaq } from './faq.js';
import { initInteractive } from './interactive.js';

function init() {
  initNavbar();
  initCalculator();
  initFaq();
  initInteractive();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
