/**
 * LicitaciónYa — Entry Point Principal (ES Modules)
 * Orquestador modular y escalable para la plataforma B2B
 */
import { initNavbar } from './navbar.js?v=20261023_v1';
import { initRadar } from './components/radar.js?v=20261023_v1';
import { initIndustries } from './components/industries.js?v=20261023_v1';
import { initExcelPreview } from './components/excel-preview.js?v=20261023_v1';
import { initCalculator } from './calculator.js?v=20261023_v1';
import { initFaq } from './faq.js?v=20261023_v1';
import { initTrialModal } from './modal.js?v=20261023_v1';

function initApp() {
  initNavbar();
  initRadar();
  initIndustries();
  initExcelPreview();
  initCalculator();
  initFaq();
  initTrialModal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
