/**
 * LicitaciónYa — B2B Fast Onboarding Modal Controller
 */

export function initTrialModal() {
  const modal = document.getElementById('trial-modal');
  if (!modal) return;

  const closeBtn = document.getElementById('modal-close');
  const form = document.getElementById('trial-form');
  const formView = document.getElementById('modal-form-view');
  const successView = document.getElementById('modal-success-view');

  // Trigger buttons
  const triggers = document.querySelectorAll(
    '#btn-activate-trial, #btn-open-modal-pricing, #btn-open-modal-footer, #footer-action-btn, .btn-open-trial, a[href="#registro"]'
  );

  function openModal(e) {
    if (e) e.preventDefault();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Reset views if previously completed
    if (formView && successView) {
      formView.style.display = 'block';
      successView.style.display = 'none';
    }

    const firstInput = document.getElementById('trial-empresa');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 150);
    }
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  triggers.forEach(btn => {
    btn.addEventListener('click', openModal);
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Check URL hash for #registro or #piloto
  if (window.location.hash === '#registro' || window.location.hash === '#piloto') {
    openModal();
  }

  // Form Validation & Submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const empresaEl = document.getElementById('trial-empresa');
      const rucEl = document.getElementById('trial-ruc');
      const rubroEl = document.getElementById('trial-rubro');
      const whatsappEl = document.getElementById('trial-whatsapp');
      const emailEl = document.getElementById('trial-email');

      let isValid = true;

      // Validate Empresa
      const empresaVal = empresaEl ? empresaEl.value.trim() : '';
      if (!empresaVal || empresaVal.length < 3) {
        setFieldError(empresaEl, true);
        isValid = false;
      } else {
        setFieldError(empresaEl, false);
      }

      // Validate RUC (13 digits in Ecuador)
      const rucVal = rucEl ? rucEl.value.trim().replace(/\D/g, '') : '';
      if (rucVal.length !== 13) {
        setFieldError(rucEl, true);
        isValid = false;
      } else {
        setFieldError(rucEl, false);
      }

      // Validate WhatsApp (9-10 digits without prefix)
      const waVal = whatsappEl ? whatsappEl.value.trim().replace(/\D/g, '') : '';
      if (waVal.length < 9) {
        setFieldError(whatsappEl, true);
        isValid = false;
      } else {
        setFieldError(whatsappEl, false);
      }

      // Validate Email
      const emailVal = emailEl ? emailEl.value.trim() : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal || !emailRegex.test(emailVal)) {
        setFieldError(emailEl, true);
        isValid = false;
      } else {
        setFieldError(emailEl, false);
      }

      if (!isValid) return;

      const rubroVal = rubroEl ? rubroEl.options[rubroEl.selectedIndex].text : 'Ferretería Industrial & Acero';

      // Build customer object
      const customer = {
        empresa: empresaVal,
        ruc: rucVal,
        whatsapp: '+593 ' + waVal,
        email: emailVal,
        rubro: rubroVal,
        plan: 'Suscripción Integral B2B ($80/mes + IVA)',
        trialDaysRemaining: 15,
        registeredAt: new Date().toISOString(),
        status: 'trial_active',
        channels: {
          whatsappAlerts: true,
          emailReports: true
        }
      };

      // Persist in localStorage
      try {
        localStorage.setItem('licitacionya_current_client', JSON.stringify(customer));
        
        // Also add to mock database of registered clients
        const existingDb = JSON.parse(localStorage.getItem('licitacionya_clients_db') || '[]');
        existingDb.push(customer);
        localStorage.setItem('licitacionya_clients_db', JSON.stringify(existingDb));
      } catch (err) {
        console.warn('Storage error:', err);
      }

      // Populate Success View
      document.getElementById('success-empresa').textContent = customer.empresa;
      document.getElementById('success-ruc').textContent = customer.ruc;
      document.getElementById('success-whatsapp').textContent = customer.whatsapp;
      document.getElementById('success-email').textContent = customer.email;

      // Update link to Portal
      const portalBtn = document.getElementById('btn-go-to-portal');
      if (portalBtn) {
        portalBtn.href = `portal.html?ruc=${encodeURIComponent(customer.ruc)}`;
      }

      // Switch View
      formView.style.display = 'none';
      successView.style.display = 'block';
    });
  }

  function setFieldError(inputEl, isError) {
    if (!inputEl) return;
    const group = inputEl.closest('.form-group');
    if (group) {
      if (isError) {
        group.classList.add('has-error');
      } else {
        group.classList.remove('has-error');
      }
    }
  }
}
