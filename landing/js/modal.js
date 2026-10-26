/**
 * LicitaciónYa — Onboarding
 * Valida, envía a /api/register y solo muestra éxito cuando el backend confirma.
 * No modifica el contrato de la API.
 */

export function initTrialModal() {
  const modal = document.getElementById('trial-modal');
  if (!modal) return;

  const closeBtn = document.getElementById('modal-close');
  const form = document.getElementById('trial-form');
  const formView = document.getElementById('modal-form-view');
  const successView = document.getElementById('modal-success-view');
  const errorBox = document.getElementById('modal-error');

  let lastFocused = null;

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.classList.add('is-visible');
    errorBox.setAttribute('tabindex', '-1');
    errorBox.focus();
  }

  function hideError() {
    if (!errorBox) return;
    errorBox.textContent = '';
    errorBox.classList.remove('is-visible');
  }

  function setFieldError(input, isError) {
    if (!input) return;
    const group = input.closest('.form-group');
    if (group) group.classList.toggle('has-error', isError);
  }

  function clearFieldErrors() {
    form?.querySelectorAll('.form-group.has-error').forEach((group) => {
      group.classList.remove('has-error');
    });
  }

  function openModal(event) {
    if (event) event.preventDefault();
    lastFocused = document.activeElement;

    if (formView && successView && !successView.hidden) {
      form?.reset();
      clearFieldErrors();
    }

    hideError();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (formView) formView.hidden = false;
    if (successView) successView.hidden = true;

    if (successPasswordInput) {
      successPasswordInput.value = '';
      successPasswordInput.type = 'password';
    }
    if (btnToggleSuccessPw) {
      const iconEye = btnToggleSuccessPw.querySelector('.icon-eye');
      const iconEyeOff = btnToggleSuccessPw.querySelector('.icon-eye-off');
      if (iconEye) iconEye.hidden = false;
      if (iconEyeOff) iconEyeOff.hidden = true;
    }
    if (successPasswordFeedback) {
      successPasswordFeedback.textContent = '';
      successPasswordFeedback.className = 'password-feedback';
      successPasswordFeedback.hidden = true;
    }
    if (btnSaveSuccessPw) {
      btnSaveSuccessPw.disabled = false;
      btnSaveSuccessPw.textContent = 'Guardar clave';
    }

    window.setTimeout(() => {
      document.getElementById('trial-empresa')?.focus();
    }, 90);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  document.querySelectorAll('.js-open-trial, a[href="#registro"], a[href="#piloto"]').forEach((trigger) => {
    trigger.addEventListener('click', openModal);
  });

  closeBtn?.addEventListener('click', closeModal);
  document.querySelectorAll('.js-close-modal').forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      closeModal();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = Array.from(modal.querySelectorAll(focusableSelector)).filter(
      (element) => element.offsetParent !== null
    );

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  if (window.location.hash === '#registro' || window.location.hash === '#piloto') {
    openModal();
  }

  const successPasswordInput = document.getElementById('success-password');
  const btnToggleSuccessPw = document.getElementById('btn-toggle-success-pw');
  const btnSaveSuccessPw = document.getElementById('btn-save-success-pw');
  const successPasswordFeedback = document.getElementById('success-password-feedback');
  const successHintPhone4 = document.getElementById('success-hint-phone4');
  const portalLink = document.getElementById('btn-go-to-portal');

  let currentClientData = null;

  async function persistPassword(pwd) {
    if (!currentClientData) return false;
    currentClientData.password = pwd;

    try {
      localStorage.setItem('licitacionya_current_client', JSON.stringify(currentClientData));
      const existing = JSON.parse(localStorage.getItem('licitacionya_clients_db') || '[]');
      const filtered = existing.filter((client) => client.ruc !== currentClientData.ruc);
      filtered.push(currentClientData);
      localStorage.setItem('licitacionya_clients_db', JSON.stringify(filtered));
    } catch (storageError) {
      console.warn('No se pudo guardar la clave en almacenamiento local:', storageError);
    }

    try {
      await fetch('/api/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruc: currentClientData.ruc, password: pwd })
      });
    } catch (apiError) {
      console.warn('No se pudo sincronizar la clave con el servidor:', apiError);
    }

    return true;
  }

  btnToggleSuccessPw?.addEventListener('click', () => {
    if (!successPasswordInput) return;
    const isPassword = successPasswordInput.type === 'password';
    successPasswordInput.type = isPassword ? 'text' : 'password';
    const iconEye = btnToggleSuccessPw.querySelector('.icon-eye');
    const iconEyeOff = btnToggleSuccessPw.querySelector('.icon-eye-off');
    if (iconEye) iconEye.hidden = isPassword;
    if (iconEyeOff) iconEyeOff.hidden = !isPassword;
  });

  async function handleSavePassword() {
    if (!successPasswordInput || !successPasswordFeedback) return;
    const pwd = successPasswordInput.value.trim();

    if (!pwd) {
      successPasswordFeedback.textContent = 'Ingrese una contraseña para su cuenta (mínimo 6 caracteres).';
      successPasswordFeedback.className = 'password-feedback is-error';
      successPasswordFeedback.hidden = false;
      successPasswordInput.focus();
      return;
    }

    if (pwd.length < 6) {
      successPasswordFeedback.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      successPasswordFeedback.className = 'password-feedback is-error';
      successPasswordFeedback.hidden = false;
      successPasswordInput.focus();
      return;
    }

    if (btnSaveSuccessPw) {
      btnSaveSuccessPw.disabled = true;
      btnSaveSuccessPw.textContent = 'Guardando…';
    }

    await persistPassword(pwd);

    if (btnSaveSuccessPw) {
      btnSaveSuccessPw.disabled = false;
      btnSaveSuccessPw.textContent = '✓ Guardada';
    }

    successPasswordFeedback.textContent = '✓ Contraseña guardada correctamente para su portal.';
    successPasswordFeedback.className = 'password-feedback is-success';
    successPasswordFeedback.hidden = false;
  }

  btnSaveSuccessPw?.addEventListener('click', handleSavePassword);

  successPasswordInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSavePassword();
    }
  });

  portalLink?.addEventListener('click', async (event) => {
    const pwd = successPasswordInput?.value.trim() || '';
    if (pwd) {
      if (pwd.length < 6) {
        event.preventDefault();
        if (successPasswordFeedback) {
          successPasswordFeedback.textContent = 'La contraseña debe tener al menos 6 caracteres antes de ingresar.';
          successPasswordFeedback.className = 'password-feedback is-error';
          successPasswordFeedback.hidden = false;
        }
        successPasswordInput?.focus();
        return;
      }
      if (!currentClientData?.password || currentClientData.password !== pwd) {
        await persistPassword(pwd);
      }
    }
  });

  if (!form) return;

  form.querySelectorAll('input, select').forEach((input) => {
    input.addEventListener('input', () => setFieldError(input, false));
    input.addEventListener('change', () => setFieldError(input, false));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideError();

    const empresaEl = document.getElementById('trial-empresa');
    const rucEl = document.getElementById('trial-ruc');
    const rubroEl = document.getElementById('trial-rubro');
    const whatsappEl = document.getElementById('trial-whatsapp');
    const emailEl = document.getElementById('trial-email');
    const submitBtn = document.getElementById('btn-submit-trial');

    const empresa = empresaEl?.value.trim() || '';
    const ruc = (rucEl?.value || '').replace(/\D/g, '');
    const whatsapp = (whatsappEl?.value || '').replace(/\D/g, '');
    const email = emailEl?.value.trim() || '';
    const province = Number.parseInt(ruc.slice(0, 2), 10);

    let isValid = true;

    if (empresa.length < 3) {
      setFieldError(empresaEl, true);
      isValid = false;
    }

    if (ruc.length !== 13 || province < 1 || (province > 24 && province !== 30)) {
      setFieldError(rucEl, true);
      isValid = false;
    }

    if (whatsapp.length < 9 || whatsapp.length > 10) {
      setFieldError(whatsappEl, true);
      isValid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(emailEl, true);
      isValid = false;
    }

    if (!rubroEl || !rubroEl.value) {
      setFieldError(rubroEl, true);
      isValid = false;
    }

    if (!isValid) {
      const firstInvalid = form.querySelector('.form-group.has-error .input');
      firstInvalid?.focus();
      return;
    }

    const rubro = rubroEl.options[rubroEl.selectedIndex].text;
    const phoneLast4 = whatsapp.slice(-4);
    const payload = {
      empresa,
      ruc,
      whatsapp: `+593 ${whatsapp}`,
      phoneLast4,
      email,
      rubro
    };

    const originalButton = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.textContent = 'Conectando radar…';
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'No pudimos registrar la solicitud. Intente de nuevo.');
      }

      const clientData = {
        empresa,
        ruc,
        whatsapp: payload.whatsapp,
        phoneLast4,
        email,
        rubro,
        plan: 'Plan Proveedor B2B · USD 80 + IVA / mes',
        trialDaysRemaining: 15,
        registeredAt: new Date().toISOString(),
        ...(data.client || {})
      };

      currentClientData = clientData;

      try {
        localStorage.setItem('licitacionya_current_client', JSON.stringify(clientData));
        const existing = JSON.parse(localStorage.getItem('licitacionya_clients_db') || '[]');
        const filtered = existing.filter((client) => client.ruc !== clientData.ruc);
        filtered.push(clientData);
        localStorage.setItem('licitacionya_clients_db', JSON.stringify(filtered));
      } catch (storageError) {
        console.warn('No se pudo guardar la sesión local:', storageError);
      }

      document.getElementById('success-empresa').textContent = clientData.empresa;
      document.getElementById('success-ruc').textContent = clientData.ruc;
      document.getElementById('success-whatsapp').textContent = clientData.whatsapp;
      document.getElementById('success-email').textContent = clientData.email;

      if (successHintPhone4) {
        successHintPhone4.textContent = clientData.phoneLast4 || phoneLast4;
      }
      if (successPasswordInput) {
        successPasswordInput.value = '';
        successPasswordInput.type = 'password';
      }
      if (btnSaveSuccessPw) {
        btnSaveSuccessPw.disabled = false;
        btnSaveSuccessPw.textContent = 'Guardar clave';
      }
      if (successPasswordFeedback) {
        successPasswordFeedback.textContent = '';
        successPasswordFeedback.className = 'password-feedback';
        successPasswordFeedback.hidden = true;
      }

      if (portalLink) {
        portalLink.href = `portal.html?ruc=${encodeURIComponent(clientData.ruc)}`;
      }

      if (formView) formView.hidden = true;
      if (successView) successView.hidden = false;

      const successTitle = successView?.querySelector('.modal-title');
      if (successTitle) {
        successTitle.setAttribute('tabindex', '-1');
        successTitle.focus();
      }
    } catch (error) {
      const message = error instanceof TypeError
        ? 'No pudimos conectar con el servidor. Intente de nuevo o escriba a contacto@j2sdynamics.com.'
        : error.message;
      showError(message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
        submitBtn.innerHTML = originalButton;
      }
    }
  });
}
