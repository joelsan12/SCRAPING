/**
 * LicitaciónYa — B2B Fast Onboarding Modal Controller
 * Conecta con /api/register para persistencia en Turso y despacho con Resend
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

  function setFieldError(inputEl, isError) {
    if (!inputEl) return;
    const parent = inputEl.closest('.form-group');
    if (parent) {
      if (isError) {
        parent.classList.add('has-error');
      } else {
        parent.classList.remove('has-error');
      }
    }
  }

  // Form Validation & Submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const empresaEl = document.getElementById('trial-empresa');
      const rucEl = document.getElementById('trial-ruc');
      const rubroEl = document.getElementById('trial-rubro');
      const whatsappEl = document.getElementById('trial-whatsapp');
      const emailEl = document.getElementById('trial-email');
      const submitBtn = document.getElementById('btn-submit-trial');

      let isValid = true;

      // 1. Validate Empresa
      const empresaVal = empresaEl ? empresaEl.value.trim() : '';
      if (!empresaVal || empresaVal.length < 3) {
        setFieldError(empresaEl, true);
        isValid = false;
      } else {
        setFieldError(empresaEl, false);
      }

      // 2. Validate RUC (13 digits in Ecuador + provincial check)
      const rucVal = rucEl ? rucEl.value.trim().replace(/\D/g, '') : '';
      const prov = parseInt(rucVal.substring(0, 2), 10);
      if (rucVal.length !== 13 || prov < 1 || (prov > 24 && prov !== 30)) {
        setFieldError(rucEl, true);
        isValid = false;
      } else {
        setFieldError(rucEl, false);
      }

      // 3. Validate WhatsApp (9-10 digits)
      const waVal = whatsappEl ? whatsappEl.value.trim().replace(/\D/g, '') : '';
      if (waVal.length < 9) {
        setFieldError(whatsappEl, true);
        isValid = false;
      } else {
        setFieldError(whatsappEl, false);
      }

      // 4. Validate Email
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
      const phoneLast4 = waVal.slice(-4);

      const requestPayload = {
        empresa: empresaVal,
        ruc: rucVal,
        whatsapp: '+593 ' + waVal,
        phoneLast4: phoneLast4,
        email: emailVal,
        rubro: rubroVal
      };

      // Set Loading State
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span>Conectando radar...</span>
          <svg class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
        `;
      }

      let clientData = {
        empresa: empresaVal,
        ruc: rucVal,
        whatsapp: '+593 ' + waVal,
        phoneLast4: phoneLast4,
        email: emailVal,
        rubro: rubroVal,
        plan: 'Suscripción Integral B2B ($80 USD/mes + IVA)',
        trialDaysRemaining: 15,
        registeredAt: new Date().toISOString()
      };

      try {
        // Enviar a Cloudflare Pages Function
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.client) {
            clientData = { ...clientData, ...resData.client };
          }
        } else {
          console.info('API local / offline fallback en ejecución.');
        }
      } catch (netErr) {
        console.info('Petición de registro en modo estático/local:', netErr.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }

      // Persist active client locally for instant session
      try {
        localStorage.setItem('licitacionya_current_client', JSON.stringify(clientData));
        const existingDb = JSON.parse(localStorage.getItem('licitacionya_clients_db') || '[]');
        const filtered = existingDb.filter(c => c.ruc !== clientData.ruc);
        filtered.push(clientData);
        localStorage.setItem('licitacionya_clients_db', JSON.stringify(filtered));
      } catch (err) {
        console.warn('Storage error:', err);
      }

      // Populate Success View
      document.getElementById('success-empresa').textContent = clientData.empresa;
      document.getElementById('success-ruc').textContent = clientData.ruc;
      document.getElementById('success-whatsapp').textContent = clientData.whatsapp;
      document.getElementById('success-email').textContent = clientData.email;

      // Update link to Portal with RUC
      const portalBtn = document.getElementById('btn-go-to-portal');
      if (portalBtn) {
        portalBtn.href = `portal.html?ruc=${encodeURIComponent(clientData.ruc)}`;
      }

      // Transition Views
      if (formView && successView) {
        formView.style.display = 'none';
        successView.style.display = 'block';
      }
    });
  }
}
