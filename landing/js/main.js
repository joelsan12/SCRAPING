/**
 * LicitaciónYa — Main Application Entry Point (ES Module)
 */

import { initNavbar } from './navbar.js';
import { initCalculator } from './calculator.js';
import { initFaq } from './faq.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI Components
  initNavbar();
  initCalculator();
  initFaq();
});
