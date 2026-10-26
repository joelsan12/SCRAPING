/**
 * LicitaciónYa — Portal de clientes v3.1
 *
 * Capa de presentación. Mantiene el contrato actual de /api/client y el acceso
 * con RUC + últimos 4 dígitos del WhatsApp. La calibración y los canales se
 * guardan como borrador local y se envían a soporte por correo: no se simula
 * persistencia en servidor ni se inventan oportunidades reales.
 */

(() => {
  'use strict';

  const CURRENT_KEY = 'licitacionya_current_client';
  const CLIENTS_KEY = 'licitacionya_clients_db';
  const ECT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const SUPPORT_EMAIL = 'contacto@j2sdynamics.com';
  const SERCOP_URL = 'https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/';

  const PROVINCES = [
    'Azuay',
    'Bolívar',
    'Cañar',
    'Carchi',
    'Chimborazo',
    'Cotopaxi',
    'El Oro',
    'Esmeraldas',
    'Galápagos',
    'Guayas',
    'Imbabura',
    'Loja',
    'Los Ríos',
    'Manabí',
    'Morona Santiago',
    'Napo',
    'Orellana',
    'Pastaza',
    'Pichincha',
    'Santa Elena',
    'Santo Domingo de los Tsáchilas',
    'Sucumbíos',
    'Tungurahua',
    'Zamora Chinchipe'
  ];

  const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MONTH_NAMES = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre'
  ];

  const KEYWORD_LIBRARY = {
    ferreteria: [
      'pernos alta resistencia',
      'discos de corte',
      'soldadura 7018',
      'herramientas eléctricas',
      'rodamientos',
      'seguridad industrial',
      'plancha galvanizada',
      'electrodos'
    ],
    construccion: [
      'cemento portland',
      'varilla corrugada',
      'asfalto',
      'adoquines',
      'geomembrana',
      'perfiles estructurales',
      'áridos',
      'malla electrosoldada'
    ],
    electrico: [
      'transformadores trifásicos',
      'cable de cobre',
      'conductor de aluminio',
      'seccionadores',
      'aisladores poliméricos',
      'luminarias LED',
      'tableros eléctricos'
    ],
    sanitario: [
      'tubería PEAD',
      'tubería PVC unión Z',
      'válvulas compuerta',
      'medidores de agua',
      'accesorios hierro fundido',
      'hidrantes',
      'bombas centrífugas'
    ]
  };

  const STATUS_META = {
    open: { label: 'Abierta', className: 'status--open' },
    closing: { label: 'Por vencer', className: 'status--closing' },
    awarded: { label: 'Adjudicada', className: 'status--awarded' }
  };

  const numberFormatter = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const dateFormatter = new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Guayaquil'
  });

  const timeFormatter = new Intl.DateTimeFormat('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/Guayaquil'
  });

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const loginView = document.getElementById('portal-login-view');
    const dashboardView = document.getElementById('portal-dashboard-view');

    if (!loginView || !dashboardView) return;

    const loginForm = document.getElementById('portal-login-form');
    const loginRuc = document.getElementById('portal-login-ruc');
    const loginPhone4 = document.getElementById('portal-login-phone4');
    const loginError = document.getElementById('portal-login-error');
    const loginSubmit = document.getElementById('btn-submit-portal-login');
    const logoutBtn = document.getElementById('portal-logout-btn');
    const btnTogglePortalPw = document.getElementById('btn-toggle-portal-pw');

    const navButtons = Array.from(document.querySelectorAll('.portal-nav-btn[data-view]'));
    const viewPanels = Array.from(document.querySelectorAll('[data-view-panel]'));

    const dashEmpresa = document.getElementById('dash-empresa');
    const dashRuc = document.getElementById('dash-ruc');
    const dashRubro = document.getElementById('dash-rubro');
    const dashPlan = document.getElementById('dash-plan');
    const dashTrialDays = document.getElementById('dash-trial-days');
    const dashChannels = document.getElementById('dash-channels');

    const nextRun = document.getElementById('next-run');
    const nextRunCard = document.getElementById('next-run-card');
    const emptyNextRun = document.getElementById('empty-next-run');
    const emptyWhatsapp = document.getElementById('empty-whatsapp');
    const nextReportDate = document.getElementById('next-report-date');
    const reportEmail = document.getElementById('report-email');

    const radarToolbar = document.getElementById('radar-toolbar');
    const demoBanner = document.getElementById('demo-banner');
    const radarCount = document.getElementById('radar-count');
    const radarEmpty = document.getElementById('radar-empty');
    const radarList = document.getElementById('radar-list');
    const radarSearch = document.getElementById('radar-search');
    const radarStatusFilter = document.getElementById('radar-status-filter');
    const radarProvinceFilter = document.getElementById('radar-province-filter');
    const radarAmountFilter = document.getElementById('radar-amount-filter');
    const btnDemoRadar = document.getElementById('btn-demo-radar');
    const btnExitDemo = document.getElementById('btn-exit-demo');

    const keywordsWrap = document.getElementById('keywords-chips');
    const inputNewKeyword = document.getElementById('input-new-kw');
    const btnAddKeyword = document.getElementById('btn-add-kw');
    const calProvince = document.getElementById('cal-province');
    const calAmount = document.getElementById('cal-amount');
    const calFeedback = document.getElementById('cal-feedback');
    const btnSaveCalibration = document.getElementById('btn-save-calibracion');
    const btnSendCalibration = document.getElementById('btn-send-calibracion');

    const channelWhatsapp = document.getElementById('channel-whatsapp');
    const channelEmail = document.getElementById('channel-email');
    const toggleWhatsapp = document.getElementById('toggle-whatsapp');
    const toggleEmail = document.getElementById('toggle-email');
    const channelsFeedback = document.getElementById('channels-feedback');
    const btnSaveChannels = document.getElementById('btn-save-channels');
    const btnSendChannels = document.getElementById('btn-send-channels');

    const accountEmpresa = document.getElementById('account-empresa');
    const accountRuc = document.getElementById('account-ruc');
    const accountRubro = document.getElementById('account-rubro');
    const accountPlan = document.getElementById('account-plan');
    const accountTrial = document.getElementById('account-trial');
    const accountEmail = document.getElementById('account-email');
    const accountStatus = document.getElementById('account-status');
    const formChangePassword = document.getElementById('form-change-password');
    const inputNewPassword = document.getElementById('input-new-password');
    const inputConfirmPassword = document.getElementById('input-confirm-password');
    const btnToggleNewPw = document.getElementById('btn-toggle-new-pw');
    const btnToggleConfirmPw = document.getElementById('btn-toggle-confirm-pw');
    const btnUpdatePassword = document.getElementById('btn-update-password');
    const accountPwFeedback = document.getElementById('account-pw-feedback');
    const accountPwStatus = document.getElementById('account-pw-status');
    const accountPhone4Hint = document.getElementById('account-phone4-hint');

    const drawerBackdrop = document.getElementById('radar-drawer');
    const drawerTitle = document.getElementById('drawer-title');
    const drawerKicker = document.getElementById('drawer-kicker');
    const drawerBody = document.getElementById('drawer-body');
    const drawerClose = document.getElementById('drawer-close');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let activeClient = null;
    let demoActive = false;
    let demoTenders = [];
    let lastDrawerTrigger = null;
    let demoTimer = null;

    let calibration = {
      keywords: [],
      province: '',
      amount: 500
    };

    let channels = {
      whatsapp: '',
      email: '',
      whatsappEnabled: true,
      emailEnabled: true
    };

    populateProvinceSelect(calProvince, '', 'Todas las provincias');
    populateProvinceSelect(radarProvinceFilter, 'all', 'Todas las provincias');
    setLoginError('');
    updateTimes();

    const storedClient = readStoredClient();
    if (storedClient) {
      renderDashboard(storedClient);
    } else {
      showLogin();
      const rucParam = new URLSearchParams(window.location.search).get('ruc');
      if (rucParam && /^\d{13}$/.test(rucParam)) {
        loginRuc.value = rucParam;
        loginPhone4.focus();
      }
    }

    demoTimer = window.setInterval(updateTimes, 60 * 1000);
    window.addEventListener('beforeunload', () => {
      if (demoTimer) window.clearInterval(demoTimer);
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) updateTimes();
    });

    /* ---------------------------------------------------------------------
       Acceso
       --------------------------------------------------------------------- */

    btnTogglePortalPw?.addEventListener('click', () => {
      if (!loginPhone4) return;
      const isPassword = loginPhone4.type === 'password';
      loginPhone4.type = isPassword ? 'text' : 'password';
      const iconEye = btnTogglePortalPw.querySelector('.icon-eye');
      const iconEyeOff = btnTogglePortalPw.querySelector('.icon-eye-off');
      if (iconEye && iconEyeOff) {
        iconEye.hidden = isPassword;
        iconEyeOff.hidden = !isPassword;
      }
    });

    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setLoginError('');

        const ruc = digits(loginRuc.value);
        const secret = (loginPhone4.value || '').trim();

        if (ruc.length !== 13) {
          setLoginError('El RUC debe contener exactamente 13 dígitos numéricos.');
          loginRuc.focus();
          return;
        }

        if (!secret) {
          setLoginError('Ingrese su contraseña o los últimos 4 dígitos del WhatsApp registrado.');
          loginPhone4.focus();
          return;
        }

        const localClient = findLocalClient(ruc, secret);
        if (localClient) {
          completeLogin(localClient);
          return;
        }

        setButtonBusy(loginSubmit, true, 'Verificando identidad…');

        try {
          const secretDigits = digits(secret);
          const response = await fetch('/api/client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ruc,
              phone4: secretDigits.length === 4 ? secretDigits : '',
              password: secret
            })
          });

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              data.error || 'RUC, contraseña o últimos 4 dígitos no coinciden con un registro activo.'
            );
          }

          if (!data.client) {
            throw new Error('RUC, contraseña o últimos 4 dígitos no coinciden con un registro activo.');
          }

          completeLogin(data.client);
        } catch (error) {
          const message = error instanceof TypeError
            ? 'No pudimos conectar con el servidor. Revise su conexión o escriba a contacto@j2sdynamics.com.'
            : (error.message || 'No pudimos verificar sus datos. Intente de nuevo.');
          setLoginError(message);
        } finally {
          setButtonBusy(loginSubmit, false);
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        try {
          localStorage.removeItem(CURRENT_KEY);
        } catch (error) {
          console.warn('No se pudo cerrar la sesión local:', error);
        }

        activeClient = null;
        exitDemo();
        closeDrawer();
        resetDashboardData();
        showLogin();
        loginRuc.value = '';
        loginPhone4.value = '';
        loginPhone4.type = 'password';
        const iconEye = btnTogglePortalPw?.querySelector('.icon-eye');
        const iconEyeOff = btnTogglePortalPw?.querySelector('.icon-eye-off');
        if (iconEye) iconEye.hidden = false;
        if (iconEyeOff) iconEyeOff.hidden = true;
        loginRuc.focus();
      });
    }

    function completeLogin(client) {
      storeCurrentClient(client);
      renderDashboard(client);
    }

    function findLocalClient(ruc, secret) {
      const clients = readClientsDb();
      const secretDigits = digits(secret);
      return clients.find((client) => {
        const clientRuc = digits(client.ruc);
        const clientPhone = digits(client.whatsapp);
        const clientPhone4 = digits(client.phoneLast4 || client.phone_last4 || clientPhone.slice(-4));
        const clientPassword = (client.password || '').trim();

        if (clientRuc !== ruc) return false;

        if (clientPassword && clientPassword === secret) return true;
        if (secretDigits.length === 4 && secretDigits === clientPhone4) return true;

        return false;
      }) || null;
    }

    function setLoginError(message) {
      if (!loginError) return;
      loginError.textContent = message;
      loginError.hidden = !message;
      if (message) {
        loginError.setAttribute('tabindex', '-1');
        loginError.focus();
      }
    }

    function showLogin() {
      loginView.hidden = false;
      dashboardView.hidden = true;
      if (logoutBtn) logoutBtn.hidden = true;
      document.body.classList.remove('is-dashboard');
      document.body.style.overflow = '';
    }

    function resetDashboardData() {
      const fields = [
        dashEmpresa,
        dashRuc,
        dashRubro,
        dashPlan,
        dashTrialDays,
        dashChannels,
        accountEmpresa,
        accountRuc,
        accountRubro,
        accountPlan,
        accountTrial,
        accountEmail,
        accountPhone4Hint
      ];

      fields.forEach((field) => {
        if (field) field.textContent = '—';
      });

      if (keywordsWrap) keywordsWrap.replaceChildren();
      if (calFeedback) setFeedback(calFeedback, '');
      if (channelsFeedback) setFeedback(channelsFeedback, '');
      if (inputNewPassword) inputNewPassword.value = '';
      if (inputConfirmPassword) inputConfirmPassword.value = '';
      if (accountPwFeedback) setFeedback(accountPwFeedback, '');
    }

    /* ---------------------------------------------------------------------
       Dashboard
       --------------------------------------------------------------------- */

    function renderDashboard(client) {
      if (!client) {
        showLogin();
        return;
      }

      activeClient = client;

      loginView.hidden = true;
      dashboardView.hidden = false;
      if (logoutBtn) logoutBtn.hidden = false;
      document.body.classList.add('is-dashboard');

      const ruc = digits(client.ruc);
      const trialDays = getTrialDays(client);
      const plan = client.plan || 'Plan Proveedor B2B · USD 80 + IVA / mes';
      const rubro = client.rubro || 'Rubro sin especificar';

      if (dashEmpresa) dashEmpresa.textContent = client.empresa || 'Empresa registrada';
      if (dashRuc) dashRuc.textContent = ruc || '—';
      if (dashRubro) dashRubro.textContent = rubro;
      if (dashPlan) dashPlan.textContent = plan;
      if (dashTrialDays) setStatusPill(dashTrialDays, trialDays > 0 ? `${trialDays} días restantes` : 'Piloto finalizado', trialDays > 0 ? 'open' : 'neutral');

      if (accountEmpresa) accountEmpresa.textContent = client.empresa || '—';
      if (accountRuc) accountRuc.textContent = ruc || '—';
      if (accountRubro) accountRubro.textContent = rubro;
      if (accountPlan) accountPlan.textContent = plan;
      if (accountTrial) {
        accountTrial.textContent = trialDays > 0
          ? `${trialDays} de 15 días restantes`
          : '15 días cumplidos';
      }
      if (accountEmail) accountEmail.textContent = client.email || '—';
      if (accountStatus) setStatusPill(accountStatus, trialDays > 0 ? 'Piloto activo' : 'Piloto finalizado', trialDays > 0 ? 'open' : 'neutral');

      if (accountPhone4Hint) {
        const clientPhone = digits(client.whatsapp);
        const p4 = client.phoneLast4 || client.phone_last4 || clientPhone.slice(-4) || '----';
        accountPhone4Hint.textContent = p4;
      }
      if (accountPwStatus) {
        const hasPw = Boolean((client.password || '').trim());
        setStatusPill(accountPwStatus, hasPw ? 'Clave activa' : 'Sin clave (usa WhatsApp)', hasPw ? 'open' : 'neutral');
      }
      if (inputNewPassword) inputNewPassword.value = '';
      if (inputConfirmPassword) inputConfirmPassword.value = '';
      if (accountPwFeedback) setFeedback(accountPwFeedback, '');

      if (emptyWhatsapp) emptyWhatsapp.textContent = client.whatsapp || 'su WhatsApp registrado';
      if (reportEmail) reportEmail.textContent = client.email || 'su correo registrado';

      calibration = loadCalibration(client);
      channels = loadChannels(client);

      renderKeywords();
      if (calProvince) calProvince.value = calibration.province;
      if (calAmount) calAmount.value = String(calibration.amount);
      renderChannels();
      updateChannelsSummary();
      setFeedback(calFeedback, '');
      setFeedback(channelsFeedback, '');
      updateTimes();

      exitDemo();
      showView('radar', { focus: false, scroll: false });

      /* En móvil el formulario de acceso queda lejos del inicio: al entrar,
         el panel debe aparecer desde arriba, no a media página. */
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    function setStatusPill(element, text, variant) {
      if (!element) return;
      element.textContent = text;
      element.classList.remove('status--open', 'status--neutral', 'status--risk', 'status--closing', 'status--awarded');
      element.classList.add(`status--${variant}`);
    }

    function getTrialDays(client) {
      const startValue = client.created_at || client.registeredAt;
      const start = parseStoredDate(startValue);
      if (start) {
        const elapsed = Math.floor((Date.now() - start.getTime()) / 86400000);
        return Math.max(0, 15 - elapsed);
      }

      const storedDays = Number(client.trialDaysRemaining);
      return Number.isFinite(storedDays) ? Math.max(0, Math.floor(storedDays)) : 15;
    }

    /* ---------------------------------------------------------------------
       Navegación por vistas
       --------------------------------------------------------------------- */

    navButtons.forEach((button) => {
      button.addEventListener('click', () => showView(button.dataset.view));
    });

    document.querySelectorAll('[data-go-view]').forEach((button) => {
      button.addEventListener('click', () => showView(button.dataset.goView));
    });

    function showView(viewName, options = {}) {
      if (!activeClient) return;

      const target = viewPanels.find((panel) => panel.dataset.viewPanel === viewName) || viewPanels[0];
      if (!target) return;

      const currentView = target.dataset.viewPanel;

      navButtons.forEach((button) => {
        const isActive = button.dataset.view === currentView;
        button.classList.toggle('is-active', isActive);
        if (isActive) {
          button.setAttribute('aria-current', 'page');
        } else {
          button.removeAttribute('aria-current');
        }
      });

      viewPanels.forEach((panel) => {
        const isActive = panel === target;
        panel.hidden = !isActive;
        panel.classList.toggle('is-active', isActive);
      });

      if (options.focus === false) return;

      const heading = target.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }

      if (options.scroll !== false) {
        target.scrollIntoView({
          block: 'start',
          behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
        });
      }
    }

    /* ---------------------------------------------------------------------
       Radar: estado vacío y modo ejemplo
       --------------------------------------------------------------------- */

    demoTenders = buildDemoTenders();

    if (btnDemoRadar) {
      btnDemoRadar.addEventListener('click', () => {
        enterDemo();
      });
    }

    if (btnExitDemo) {
      btnExitDemo.addEventListener('click', () => {
        exitDemo({ restoreFocus: true });
      });
    }

    [radarSearch, radarStatusFilter, radarProvinceFilter, radarAmountFilter].forEach((control) => {
      if (!control) return;
      control.addEventListener('input', handleRadarFilter);
      control.addEventListener('change', handleRadarFilter);
    });

    function handleRadarFilter() {
      if (!demoActive) return;
      renderDemoList();
    }

    function enterDemo() {
      demoActive = true;

      if (radarToolbar) radarToolbar.hidden = false;
      if (demoBanner) demoBanner.hidden = false;
      if (radarEmpty) radarEmpty.hidden = true;
      if (radarList) radarList.hidden = false;

      renderDemoList();
    }

    function exitDemo(options = {}) {
      demoActive = false;

      if (radarToolbar) radarToolbar.hidden = true;
      if (demoBanner) demoBanner.hidden = true;
      if (radarList) {
        radarList.hidden = true;
        radarList.replaceChildren();
      }
      if (radarEmpty) radarEmpty.hidden = false;

      if (radarSearch) radarSearch.value = '';
      if (radarStatusFilter) radarStatusFilter.value = 'all';
      if (radarProvinceFilter) radarProvinceFilter.value = 'all';
      if (radarAmountFilter) radarAmountFilter.value = 'all';

      if (options.restoreFocus && btnDemoRadar) btnDemoRadar.focus();
    }

    function renderDemoList() {
      if (!radarList) return;

      const filtered = filterDemoTenders();
      radarList.replaceChildren();

      if (!filtered.length) {
        const message = document.createElement('p');
        message.className = 'radar-no-results';
        message.textContent = 'Ningún dato de ejemplo coincide con los filtros. Ajuste la búsqueda para ver otras fichas.';
        radarList.append(message);
      } else {
        const fragment = document.createDocumentFragment();
        filtered.forEach((tender) => fragment.append(buildTenderCard(tender)));
        radarList.append(fragment);
      }

      if (radarCount) {
        radarCount.textContent = `${filtered.length} de ${demoTenders.length} fichas de ejemplo.`;
      }
    }

    function filterDemoTenders() {
      const query = normalize(radarSearch ? radarSearch.value : '');
      const status = radarStatusFilter ? radarStatusFilter.value : 'all';
      const province = radarProvinceFilter ? radarProvinceFilter.value : 'all';
      const amountRange = radarAmountFilter ? radarAmountFilter.value : 'all';

      return demoTenders
        .filter((tender) => {
          if (status !== 'all' && tender.status !== status) return false;
          if (province !== 'all' && tender.province !== province) return false;

          if (amountRange === 'low' && tender.amount > 50000) return false;
          if (amountRange === 'mid' && (tender.amount <= 50000 || tender.amount > 250000)) return false;
          if (amountRange === 'high' && tender.amount <= 250000) return false;

          if (!query) return true;

          const haystack = normalize([
            tender.code,
            tender.entity,
            tender.title,
            tender.province,
            tender.description,
            ...tender.keywords
          ].join(' '));

          return haystack.includes(query);
        })
        .sort((a, b) => {
          const priority = { closing: 0, open: 1, awarded: 2 };
          const statusDifference = priority[a.status] - priority[b.status];
          if (statusDifference !== 0) return statusDifference;
          return a.deadline - b.deadline;
        });
    }

    function buildTenderCard(tender) {
      const statusMeta = STATUS_META[tender.status];

      const card = document.createElement('button');
      card.type = 'button';
      card.className = `tender-card tender-card--${tender.status}`;
      card.dataset.tenderId = tender.id;
      card.setAttribute('aria-haspopup', 'dialog');

      const top = document.createElement('span');
      top.className = 'tender-top';

      const status = document.createElement('span');
      status.className = `status ${statusMeta.className}`;
      status.textContent = statusMeta.label;

      const badge = document.createElement('span');
      badge.className = 'tender-badge';
      badge.textContent = 'Ejemplo';

      const amount = document.createElement('span');
      amount.className = 'tender-amount';
      amount.textContent = formatUsd(tender.amount);

      top.append(status, badge, amount);

      const code = document.createElement('span');
      code.className = 'tender-code';
      code.textContent = tender.code;

      const title = document.createElement('span');
      title.className = 'tender-title';
      title.textContent = tender.title;

      const meta = document.createElement('span');
      meta.className = 'tender-meta';
      meta.textContent = `${tender.entity} · ${tender.province}`;

      const foot = document.createElement('span');
      foot.className = 'tender-foot';

      const keywords = document.createElement('span');
      keywords.className = 'tender-keywords';
      keywords.textContent = tender.keywords.slice(0, 3).join(' · ');

      const openLabel = document.createElement('span');
      openLabel.className = 'tender-open';
      openLabel.textContent = 'Ver ficha →';

      foot.append(keywords, openLabel);
      card.append(top, code, title, meta, foot);

      return card;
    }

    if (radarList) {
      radarList.addEventListener('click', (event) => {
        const card = event.target.closest('.tender-card');
        if (!card) return;

        const tender = demoTenders.find((item) => item.id === card.dataset.tenderId);
        if (tender) openDrawer(tender, card);
      });
    }

    /* ---------------------------------------------------------------------
       Drawer de ficha
       --------------------------------------------------------------------- */

    if (drawerClose) {
      drawerClose.addEventListener('click', closeDrawer);
    }

    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', (event) => {
        if (event.target === drawerBackdrop) closeDrawer();
      });
    }

    document.addEventListener('keydown', (event) => {
      if (!drawerBackdrop || drawerBackdrop.hidden) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        drawerBackdrop.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((element) => element.offsetParent !== null);

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

    function openDrawer(tender, trigger) {
      if (!drawerBackdrop || !drawerBody) return;

      lastDrawerTrigger = trigger;
      const statusMeta = STATUS_META[tender.status];

      if (drawerKicker) drawerKicker.textContent = 'Ficha de ejemplo · No es un proceso real';
      if (drawerTitle) drawerTitle.textContent = tender.title;

      const fragment = document.createDocumentFragment();

      const statusRow = document.createElement('div');
      statusRow.className = 'drawer-status-row';

      const status = document.createElement('span');
      status.className = `status ${statusMeta.className}`;
      status.textContent = statusMeta.label;

      const badge = document.createElement('span');
      badge.className = 'tender-badge';
      badge.textContent = 'Dato de ejemplo';

      statusRow.append(status, badge);

      const code = document.createElement('p');
      code.className = 'drawer-code';
      code.textContent = tender.code;

      const object = document.createElement('p');
      object.className = 'drawer-object';
      object.textContent = tender.description;

      const grid = document.createElement('dl');
      grid.className = 'drawer-grid';
      appendDrawerItem(grid, 'Entidad', tender.entity);
      appendDrawerItem(grid, 'Provincia', tender.province);
      appendDrawerItem(grid, 'Monto referencial', formatUsd(tender.amount));
      appendDrawerItem(grid, 'Estado', statusMeta.label);
      appendDrawerItem(grid, 'Fecha límite', formatDateTime(tender.deadline));
      appendDrawerItem(grid, 'Publicado', formatDate(tender.publishedAt));

      const keywordSection = document.createElement('div');
      keywordSection.className = 'drawer-section';

      const keywordTitle = document.createElement('h3');
      keywordTitle.textContent = 'Términos que lo harían coincidir';

      const keywordList = document.createElement('div');
      keywordList.className = 'drawer-keywords';

      tender.keywords.forEach((keyword) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = keyword;
        keywordList.append(chip);
      });

      keywordSection.append(keywordTitle, keywordList);

      const note = document.createElement('p');
      note.className = 'drawer-note';
      note.textContent = 'Este registro es ficticio. No corresponde a una convocatoria del SERCOP ni a datos de su cuenta. Se usa solo para mostrar la estructura de una ficha.';

      const sourceLink = document.createElement('a');
      sourceLink.className = 'drawer-link';
      sourceLink.href = SERCOP_URL;
      sourceLink.target = '_blank';
      sourceLink.rel = 'noopener';
      sourceLink.textContent = 'Abrir portal oficial del SERCOP ↗';

      fragment.append(statusRow, code, object, grid, keywordSection, note, sourceLink);
      drawerBody.replaceChildren(fragment);

      drawerBackdrop.hidden = false;
      document.body.style.overflow = 'hidden';

      if (drawerClose) {
        drawerClose.focus();
      }
    }

    function appendDrawerItem(list, label, value) {
      const wrapper = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');

      term.textContent = label;
      description.textContent = value;

      wrapper.append(term, description);
      list.append(wrapper);
    }

    function closeDrawer() {
      if (!drawerBackdrop || drawerBackdrop.hidden) return;

      drawerBackdrop.hidden = true;
      document.body.style.overflow = '';

      if (lastDrawerTrigger && document.contains(lastDrawerTrigger)) {
        lastDrawerTrigger.focus();
      }

      lastDrawerTrigger = null;
    }

    /* ---------------------------------------------------------------------
       Calibración
       --------------------------------------------------------------------- */

    if (btnAddKeyword) {
      btnAddKeyword.addEventListener('click', addKeyword);
    }

    if (inputNewKeyword) {
      inputNewKeyword.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        addKeyword();
      });
    }

    if (btnSaveCalibration) {
      btnSaveCalibration.addEventListener('click', () => {
        syncCalibrationFromForm();

        if (!validateCalibration()) return;

        if (persistCalibration()) {
          setFeedback(
            calFeedback,
            `Borrador guardado en este dispositivo a las ${currentTimeLabel()}. Soporte debe confirmarlo antes de aplicarlo al monitoreo.`,
            'success'
          );
        } else {
          setFeedback(calFeedback, 'No se pudo guardar el borrador en este navegador. Revise el almacenamiento local.', 'error');
        }
      });
    }

    if (btnSendCalibration) {
      btnSendCalibration.addEventListener('click', (event) => {
        event.preventDefault();
        syncCalibrationFromForm();

        if (!validateCalibration()) return;

        if (!persistCalibration()) {
          setFeedback(calFeedback, 'No se pudo guardar el borrador antes de enviarlo. Intente de nuevo.', 'error');
          return;
        }

        const mailto = buildCalibrationMailto();
        setFeedback(calFeedback, 'Se abrirá su cliente de correo con el borrador. Envíelo para que soporte lo revise.', 'success');
        window.location.href = mailto;
      });
    }

    function addKeyword() {
      if (!inputNewKeyword) return;

      const value = inputNewKeyword.value.trim().replace(/\s+/g, ' ');

      if (!value) {
        setFeedback(calFeedback, 'Escriba una palabra clave antes de agregarla.', 'error');
        inputNewKeyword.focus();
        return;
      }

      if (value.length > 60) {
        setFeedback(calFeedback, 'Use un término de 60 caracteres o menos.', 'error');
        inputNewKeyword.focus();
        return;
      }

      if (calibration.keywords.length >= 30) {
        setFeedback(calFeedback, 'El perfil admite hasta 30 palabras clave. Elimine una antes de agregar otra.', 'error');
        return;
      }

      if (calibration.keywords.some((keyword) => normalize(keyword) === normalize(value))) {
        setFeedback(calFeedback, 'Ese término ya está en el perfil.', 'error');
        inputNewKeyword.select();
        return;
      }

      calibration.keywords.push(value);
      inputNewKeyword.value = '';
      renderKeywords();
      inputNewKeyword.focus();
      setFeedback(calFeedback, 'Término agregado al borrador. Guarde o envíe a soporte para conservarlo.', 'success');
    }

    function renderKeywords() {
      if (!keywordsWrap) return;

      keywordsWrap.replaceChildren();

      if (!calibration.keywords.length) {
        const empty = document.createElement('span');
        empty.className = 'chip-empty';
        empty.textContent = 'Sin términos todavía. Agregue al menos uno.';
        keywordsWrap.append(empty);
        return;
      }

      calibration.keywords.forEach((keyword, index) => {
        const chip = document.createElement('span');
        chip.className = 'chip';

        const text = document.createElement('span');
        text.textContent = keyword;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'chip-remove';
        remove.setAttribute('aria-label', `Eliminar ${keyword}`);
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          calibration.keywords.splice(index, 1);
          renderKeywords();
          setFeedback(calFeedback, 'Término eliminado del borrador. Guarde para conservar el cambio.', 'success');
        });

        chip.append(text, remove);
        keywordsWrap.append(chip);
      });
    }

    function syncCalibrationFromForm() {
      calibration.province = calProvince ? calProvince.value : '';
      const amount = Number(calAmount ? calAmount.value : 0);
      calibration.amount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    }

    function validateCalibration() {
      if (!calibration.keywords.length) {
        setFeedback(calFeedback, 'Agregue al menos una palabra clave al perfil.', 'error');
        if (inputNewKeyword) inputNewKeyword.focus();
        return false;
      }

      if (calibration.keywords.length > 30) {
        setFeedback(calFeedback, 'El perfil admite hasta 30 palabras clave.', 'error');
        return false;
      }

      if (!Number.isFinite(calibration.amount) || calibration.amount < 0) {
        setFeedback(calFeedback, 'El monto mínimo debe ser un número igual o mayor que cero.', 'error');
        if (calAmount) calAmount.focus();
        return false;
      }

      if (calibration.province && !PROVINCES.includes(calibration.province)) {
        setFeedback(calFeedback, 'Seleccione una provincia válida.', 'error');
        if (calProvince) calProvince.focus();
        return false;
      }

      return true;
    }

    function persistCalibration() {
      if (!activeClient) return false;

      try {
        localStorage.setItem(profileKey(activeClient.ruc), JSON.stringify({
          keywords: calibration.keywords,
          province: calibration.province,
          amount: calibration.amount,
          savedAt: new Date().toISOString()
        }));
        return true;
      } catch (error) {
        console.warn('No se pudo guardar el borrador de calibración:', error);
        return false;
      }
    }

    function loadCalibration(client) {
      const draft = readJson(profileKey(client.ruc));
      const fallbackSector = inferSector(client.rubro);
      const fallbackKeywords = Array.isArray(client.keywords) && client.keywords.length
        ? sanitizeKeywords(client.keywords)
        : (KEYWORD_LIBRARY[fallbackSector] || []);

      const draftKeywords = Array.isArray(draft?.keywords) ? sanitizeKeywords(draft.keywords) : null;
      const draftAmount = Number(draft?.amount);

      return {
        keywords: draftKeywords || fallbackKeywords,
        province: typeof draft?.province === 'string' && (draft.province === '' || PROVINCES.includes(draft.province))
          ? draft.province
          : '',
        amount: Number.isFinite(draftAmount) ? Math.max(0, draftAmount) : 500
      };
    }

    function buildCalibrationMailto() {
      const client = activeClient || {};
      const subject = `Calibración de perfil · ${client.empresa || 'Cliente'} · RUC ${digits(client.ruc)}`;
      const amount = Number(calibration.amount).toLocaleString('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      const body = [
        'Hola soporte de LicitaciónYa,',
        '',
        'Solicito revisar y aplicar esta calibración al monitoreo de mi cuenta.',
        '',
        `Empresa: ${client.empresa || '—'}`,
        `RUC: ${digits(client.ruc) || '—'}`,
        `Rubro: ${client.rubro || '—'}`,
        `Provincia prioritaria: ${calibration.province || 'Todas las provincias'}`,
        `Monto mínimo: USD ${amount}`,
        `Palabras clave (${calibration.keywords.length}): ${calibration.keywords.join(', ')}`,
        '',
        `Borrador guardado el ${formatDateTime(new Date())}.`,
        '',
        'Entiendo que este correo es una solicitud y que la calibración se aplica cuando soporte la confirma.'
      ].join('\n');

      return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    /* ---------------------------------------------------------------------
       Canales
       --------------------------------------------------------------------- */

    if (btnSaveChannels) {
      btnSaveChannels.addEventListener('click', () => {
        syncChannelsFromForm();

        if (!validateChannels()) return;

        if (persistChannels()) {
          updateChannelsSummary();
          setFeedback(
            channelsFeedback,
            `Borrador guardado en este dispositivo a las ${currentTimeLabel()}. Soporte debe verificar los canales antes de la próxima corrida.`,
            'success'
          );
        } else {
          setFeedback(channelsFeedback, 'No se pudo guardar el borrador en este navegador. Revise el almacenamiento local.', 'error');
        }
      });
    }

    if (btnSendChannels) {
      btnSendChannels.addEventListener('click', (event) => {
        event.preventDefault();
        syncChannelsFromForm();

        if (!validateChannels()) return;

        if (!persistChannels()) {
          setFeedback(channelsFeedback, 'No se pudo guardar el borrador antes de enviarlo. Intente de nuevo.', 'error');
          return;
        }

        updateChannelsSummary();
        const mailto = buildChannelsMailto();
        setFeedback(channelsFeedback, 'Se abrirá su cliente de correo con la solicitud de verificación.', 'success');
        window.location.href = mailto;
      });
    }

    function renderChannels() {
      if (channelWhatsapp) channelWhatsapp.value = channels.whatsapp;
      if (channelEmail) channelEmail.value = channels.email;
      if (toggleWhatsapp) toggleWhatsapp.checked = channels.whatsappEnabled;
      if (toggleEmail) toggleEmail.checked = channels.emailEnabled;
    }

    function syncChannelsFromForm() {
      channels.whatsapp = channelWhatsapp ? channelWhatsapp.value.trim() : '';
      channels.email = channelEmail ? channelEmail.value.trim() : '';
      channels.whatsappEnabled = toggleWhatsapp ? toggleWhatsapp.checked : false;
      channels.emailEnabled = toggleEmail ? toggleEmail.checked : false;
    }

    function validateChannels() {
      if (!channels.whatsappEnabled && !channels.emailEnabled) {
        setFeedback(channelsFeedback, 'Active al menos un canal para recibir alertas o reportes.', 'error');
        return false;
      }

      if (channels.whatsappEnabled) {
        const whatsappDigits = digits(channels.whatsapp);
        if (whatsappDigits.length < 9 || whatsappDigits.length > 15) {
          setFeedback(channelsFeedback, 'Ingrese un WhatsApp válido con código de país. Ej. +593 99 123 4567.', 'error');
          if (channelWhatsapp) channelWhatsapp.focus();
          return false;
        }
      }

      if (channels.emailEnabled && !isValidEmail(channels.email)) {
        setFeedback(channelsFeedback, 'Ingrese un correo válido para el reporte semanal.', 'error');
        if (channelEmail) channelEmail.focus();
        return false;
      }

      return true;
    }

    function persistChannels() {
      if (!activeClient) return false;

      try {
        localStorage.setItem(channelsKey(activeClient.ruc), JSON.stringify({
          whatsapp: channels.whatsapp,
          email: channels.email,
          whatsappEnabled: channels.whatsappEnabled,
          emailEnabled: channels.emailEnabled,
          savedAt: new Date().toISOString()
        }));
        return true;
      } catch (error) {
        console.warn('No se pudo guardar el borrador de canales:', error);
        return false;
      }
    }

    function loadChannels(client) {
      const draft = readJson(channelsKey(client.ruc));

      return {
        whatsapp: typeof draft?.whatsapp === 'string' ? draft.whatsapp : (client.whatsapp || ''),
        email: typeof draft?.email === 'string' ? draft.email : (client.email || ''),
        whatsappEnabled: typeof draft?.whatsappEnabled === 'boolean' ? draft.whatsappEnabled : true,
        emailEnabled: typeof draft?.emailEnabled === 'boolean' ? draft.emailEnabled : true
      };
    }

    function updateChannelsSummary() {
      if (!dashChannels) return;

      const active = [];
      if (channels.whatsappEnabled && digits(channels.whatsapp).length >= 9) active.push('WhatsApp');
      if (channels.emailEnabled && isValidEmail(channels.email)) active.push('correo');

      dashChannels.textContent = active.length ? active.join(' + ') : 'Sin canales activos';
    }

    function buildChannelsMailto() {
      const client = activeClient || {};
      const subject = `Verificación de canales · ${client.empresa || 'Cliente'} · RUC ${digits(client.ruc)}`;

      const body = [
        'Hola soporte de LicitaciónYa,',
        '',
        'Solicito verificar los canales de entrega de mi cuenta.',
        '',
        `Empresa: ${client.empresa || '—'}`,
        `RUC: ${digits(client.ruc) || '—'}`,
        `WhatsApp: ${channels.whatsapp || '—'}`,
        `Alertas por WhatsApp: ${channels.whatsappEnabled ? 'activadas' : 'desactivadas'}`,
        `Correo: ${channels.email || '—'}`,
        `Reporte semanal por correo: ${channels.emailEnabled ? 'activado' : 'desactivado'}`,
        '',
        `Borrador guardado el ${formatDateTime(new Date())}.`,
        '',
        'Entiendo que los cambios se aplican cuando soporte confirma la verificación.'
      ].join('\n');

      return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    /* ---------------------------------------------------------------------
       Cuenta: Actualización de contraseña
       --------------------------------------------------------------------- */

    function setupPasswordToggle(button, input) {
      if (!button || !input) return;
      button.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        const iconEye = button.querySelector('.icon-eye');
        const iconEyeOff = button.querySelector('.icon-eye-off');
        if (iconEye && iconEyeOff) {
          iconEye.hidden = isPassword;
          iconEyeOff.hidden = !isPassword;
        }
      });
    }

    setupPasswordToggle(btnToggleNewPw, inputNewPassword);
    setupPasswordToggle(btnToggleConfirmPw, inputConfirmPassword);

    if (formChangePassword) {
      formChangePassword.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!activeClient) return;

        setFeedback(accountPwFeedback, '');

        const newPw = (inputNewPassword?.value || '').trim();
        const confirmPw = (inputConfirmPassword?.value || '').trim();

        if (!newPw) {
          setFeedback(accountPwFeedback, 'Ingrese una nueva contraseña (mínimo 6 caracteres).', 'error');
          inputNewPassword?.focus();
          return;
        }

        if (newPw.length < 6) {
          setFeedback(accountPwFeedback, 'La contraseña debe tener al menos 6 caracteres.', 'error');
          inputNewPassword?.focus();
          return;
        }

        if (newPw !== confirmPw) {
          setFeedback(accountPwFeedback, 'Las contraseñas no coinciden. Verifique ambas claves.', 'error');
          inputConfirmPassword?.focus();
          return;
        }

        setButtonBusy(btnUpdatePassword, true, 'Guardando…');

        try {
          const res = await fetch('/api/password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ruc: digits(activeClient.ruc), password: newPw })
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok && data.success === false) {
            throw new Error(data.error || 'No se pudo actualizar la contraseña en el servidor.');
          }

          // Actualizar en sesión activa y base local
          activeClient.password = newPw;
          storeCurrentClient(activeClient);
          updateClientInDb(activeClient);

          if (accountPwStatus) {
            setStatusPill(accountPwStatus, 'Clave activa', 'open');
          }

          if (inputNewPassword) inputNewPassword.value = '';
          if (inputConfirmPassword) inputConfirmPassword.value = '';

          setFeedback(accountPwFeedback, '✓ Contraseña actualizada correctamente.', 'success');
        } catch (error) {
          // Si no hay conexión al backend, persistimos localmente de forma resiliente
          activeClient.password = newPw;
          storeCurrentClient(activeClient);
          updateClientInDb(activeClient);

          if (accountPwStatus) {
            setStatusPill(accountPwStatus, 'Clave activa', 'open');
          }

          if (inputNewPassword) inputNewPassword.value = '';
          if (inputConfirmPassword) inputConfirmPassword.value = '';

          setFeedback(accountPwFeedback, '✓ Contraseña guardada en este dispositivo.', 'success');
        } finally {
          setButtonBusy(btnUpdatePassword, false);
        }
      });
    }

    function updateClientInDb(updatedClient) {
      try {
        const existing = readClientsDb();
        const clientRuc = digits(updatedClient.ruc);
        const filtered = existing.filter((c) => digits(c.ruc) !== clientRuc);
        filtered.push(updatedClient);
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(filtered));
      } catch (err) {
        console.warn('Error actualizando cliente en BD local:', err);
      }
    }

    /* ---------------------------------------------------------------------
       Fechas y estado operativo
       --------------------------------------------------------------------- */

    function updateTimes() {
      const nextRunLabel = formatNextRun(nextCycle());

      if (nextRun) nextRun.textContent = nextRunLabel;
      if (nextRunCard) nextRunCard.textContent = nextRunLabel;
      if (emptyNextRun) emptyNextRun.textContent = nextRunLabel;
      if (nextReportDate) nextReportDate.textContent = formatReportDate(nextMondayEight());
    }

    /* ---------------------------------------------------------------------
       Datos de ejemplo
       --------------------------------------------------------------------- */

    function buildDemoTenders() {
      return [
        {
          id: 'demo-ferreteria-01',
          code: 'EJEMPLO-FER-2026-001',
          entity: 'Entidad Pública de Ejemplo — Dirección Zonal Norte',
          province: 'Pichincha',
          title: 'Adquisición de materiales de ferretería y suministros de mantenimiento',
          description: 'Compra de tornillería, herramienta manual, soldadura y equipo de seguridad industrial para mantenimiento de instalaciones. Registro ficticio usado para mostrar la estructura de una ficha.',
          amount: 84250,
          status: 'open',
          deadline: inEctDays(7, 15),
          publishedAt: inEctDays(-1, 9),
          keywords: ['pernos alta resistencia', 'soldadura 7018', 'seguridad industrial', 'herramientas eléctricas']
        },
        {
          id: 'demo-construccion-01',
          code: 'EJEMPLO-CON-2026-014',
          entity: 'Municipio de Ejemplo — Obras Públicas',
          province: 'Guayas',
          title: 'Suministro de materiales para reposición de aceras y espacio público',
          description: 'Adquisición de cemento, varilla corrugada, adoquines y materiales para obra civil menor. Registro ficticio usado para mostrar la estructura de una ficha.',
          amount: 312400,
          status: 'open',
          deadline: inEctDays(11, 11),
          publishedAt: inEctDays(-2, 16),
          keywords: ['cemento portland', 'varilla corrugada', 'adoquines', 'malla electrosoldada']
        },
        {
          id: 'demo-electrico-01',
          code: 'EJEMPLO-ELE-2026-007',
          entity: 'Empresa Eléctrica de Ejemplo EP',
          province: 'Tungurahua',
          title: 'Reposición de luminarias LED y material de distribución',
          description: 'Compra de luminarias, cable de cobre y accesorios para mantenimiento de redes de baja tensión. Registro ficticio usado para mostrar la estructura de una ficha.',
          amount: 47800,
          status: 'closing',
          deadline: inEctDays(2, 10),
          publishedAt: inEctDays(-6, 14),
          keywords: ['luminarias LED', 'cable de cobre', 'tableros eléctricos', 'seccionadores']
        },
        {
          id: 'demo-sanitario-01',
          code: 'EJEMPLO-SAN-2026-021',
          entity: 'Empresa Municipal de Ejemplo — Agua y Saneamiento',
          province: 'Manabí',
          title: 'Adquisición de tubería y válvulas para red de agua potable',
          description: 'Suministro de tubería PEAD, válvulas compuerta y accesorios para reposición de red. Registro ficticio usado para mostrar la estructura de una ficha.',
          amount: 128900,
          status: 'open',
          deadline: inEctDays(14, 9),
          publishedAt: inEctDays(-3, 12),
          keywords: ['tubería PEAD', 'válvulas compuerta', 'medidores de agua', 'hidrantes']
        },
        {
          id: 'demo-ferreteria-02',
          code: 'EJEMPLO-FER-2026-019',
          entity: 'Instituto de Ejemplo para la Infraestructura',
          province: 'Azuay',
          title: 'Herramienta menor y consumibles para talleres de mantenimiento',
          description: 'Compra de discos de corte, electrodos, rodamientos y herramienta menor. Registro ficticio usado para mostrar la estructura de una ficha.',
          amount: 22600,
          status: 'closing',
          deadline: inEctDays(1, 17),
          publishedAt: inEctDays(-9, 8),
          keywords: ['discos de corte', 'electrodos', 'rodamientos', 'herramientas eléctricas']
        },
        {
          id: 'demo-construccion-02',
          code: 'EJEMPLO-CON-2026-030',
          entity: 'Servicio de Ejemplo — Compras Centralizadas',
          province: 'Pichincha',
          title: 'Materiales para mantenimiento de infraestructura institucional',
          description: 'Adquisición de perfiles estructurales, geomembrana y materiales de obra civil. Registro ficticio usado para mostrar la estructura de una ficha.',
          amount: 540000,
          status: 'open',
          deadline: inEctDays(18, 14),
          publishedAt: inEctDays(-1, 10),
          keywords: ['perfiles estructurales', 'geomembrana', 'cemento portland', 'áridos']
        },
        {
          id: 'demo-ferreteria-03',
          code: 'EJEMPLO-FER-2026-004',
          entity: 'Hospital de Ejemplo — Unidad de Mantenimiento',
          province: 'Guayas',
          title: 'Suministros de ferretería para mantenimiento preventivo',
          description: 'Compra de material de ferretería y seguridad industrial. Registro ficticio usado para mostrar la estructura de una ficha adjudicada.',
          amount: 98750,
          status: 'awarded',
          deadline: inEctDays(-8, 15),
          publishedAt: inEctDays(-30, 9),
          keywords: ['seguridad industrial', 'pernos alta resistencia', 'discos de corte', 'rodamientos']
        }
      ];
    }

    /* ---------------------------------------------------------------------
       Helpers
       --------------------------------------------------------------------- */

    function populateProvinceSelect(select, allValue, allLabel) {
      if (!select) return;

      select.replaceChildren();

      const allOption = document.createElement('option');
      allOption.value = allValue;
      allOption.textContent = allLabel;
      select.append(allOption);

      PROVINCES.forEach((province) => {
        const option = document.createElement('option');
        option.value = province;
        option.textContent = province;
        select.append(option);
      });
    }

    function readStoredClient() {
      try {
        const raw = localStorage.getItem(CURRENT_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        console.warn('No se pudo leer la sesión local:', error);
        return null;
      }
    }

    function storeCurrentClient(client) {
      try {
        localStorage.setItem(CURRENT_KEY, JSON.stringify(client));
      } catch (error) {
        console.warn('No se pudo guardar la sesión local:', error);
      }
    }

    function readClientsDb() {
      try {
        const raw = localStorage.getItem(CLIENTS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn('No se pudo leer la base local de clientes:', error);
        return [];
      }
    }

    function readJson(key) {
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch (error) {
        return null;
      }
    }

    function profileKey(ruc) {
      return `licitacionya_profile_draft_${digits(ruc)}`;
    }

    function channelsKey(ruc) {
      return `licitacionya_channels_draft_${digits(ruc)}`;
    }

    function sanitizeKeywords(values) {
      const seen = new Set();
      const result = [];

      values.forEach((value) => {
        const keyword = String(value || '').trim().replace(/\s+/g, ' ');
        const key = normalize(keyword);

        if (!keyword || keyword.length > 60 || seen.has(key) || result.length >= 30) return;

        seen.add(key);
        result.push(keyword);
      });

      return result;
    }

    function inferSector(rubro) {
      const value = normalize(rubro);

      if (value.includes('ferreter')) return 'ferreteria';
      if (value.includes('construc') || value.includes('obra')) return 'construccion';
      if (value.includes('electric') || value.includes('redes')) return 'electrico';
      if (value.includes('tuber') || value.includes('sanea') || value.includes('hidro')) return 'sanitario';

      return '';
    }

    function digits(value) {
      return String(value == null ? '' : value).replace(/\D/g, '');
    }

    function normalize(value) {
      return String(value == null ? '' : value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
    }

    function parseStoredDate(value) {
      if (!value) return null;

      const text = String(value).trim();
      if (!text) return null;

      let normalized = text.includes('T') ? text : text.replace(' ', 'T');
      if (!normalized.includes('T')) {
        normalized += 'T00:00:00';
      }

      if (!/(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(normalized)) {
        normalized += 'Z';
      }

      const date = new Date(normalized);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatUsd(amount) {
      return numberFormatter.format(Number(amount) || 0);
    }

    function formatDate(date) {
      return dateFormatter.format(date);
    }

    function formatDateTime(date) {
      return `${dateFormatter.format(date)} · ${timeFormatter.format(date)} ECT`;
    }

    function currentTimeLabel() {
      return `${timeFormatter.format(new Date())} ECT`;
    }

    function ectParts(date = new Date()) {
      const shifted = new Date(date.getTime() - ECT_OFFSET_MS);
      return {
        year: shifted.getUTCFullYear(),
        month: shifted.getUTCMonth(),
        day: shifted.getUTCDate(),
        hour: shifted.getUTCHours(),
        weekday: shifted.getUTCDay()
      };
    }

    function ectInstant(year, month, day, hour) {
      return new Date(Date.UTC(year, month, day, hour, 0, 0) + ECT_OFFSET_MS);
    }

    function inEctDays(days, hour) {
      const now = ectParts();
      return ectInstant(now.year, now.month, now.day + days, hour);
    }

    function nextCycle(date = new Date()) {
      const parts = ectParts(date);
      let nextHour;
      let dayOffset = 0;

      if (parts.hour < 6) {
        nextHour = 6;
      } else if (parts.hour < 12) {
        nextHour = 12;
      } else if (parts.hour < 18) {
        nextHour = 18;
      } else {
        nextHour = 0;
        dayOffset = 1;
      }

      return ectInstant(parts.year, parts.month, parts.day + dayOffset, nextHour);
    }

    function nextMondayEight(date = new Date()) {
      const parts = ectParts(date);
      let daysUntilMonday = (1 - parts.weekday + 7) % 7;

      if (daysUntilMonday === 0 && parts.hour >= 8) {
        daysUntilMonday = 7;
      }

      return ectInstant(parts.year, parts.month, parts.day + daysUntilMonday, 8);
    }

    function formatNextRun(date) {
      const target = ectParts(date);
      const now = ectParts();
      const targetDay = Date.UTC(target.year, target.month, target.day);
      const today = Date.UTC(now.year, now.month, now.day);
      const dayDifference = Math.round((targetDay - today) / 86400000);
      const time = `${pad(target.hour)}:00 ECT`;

      if (dayDifference === 0) return `Hoy ${time}`;
      if (dayDifference === 1) return `Mañana ${time}`;

      return `${capitalize(DAY_NAMES[target.weekday])} ${pad(target.day)}/${pad(target.month + 1)} · ${time}`;
    }

    function formatReportDate(date) {
      const target = ectParts(date);
      return `${capitalize(DAY_NAMES[target.weekday])} ${target.day} de ${MONTH_NAMES[target.month]} de ${target.year} · 08:00 ECT`;
    }

    function pad(value) {
      return String(value).padStart(2, '0');
    }

    function capitalize(value) {
      return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
    }

    function setFeedback(element, message, type = '') {
      if (!element) return;

      element.textContent = message;
      element.hidden = !message;
      element.classList.toggle('is-error', type === 'error');
      element.classList.toggle('is-success', type === 'success');
    }

    function setButtonBusy(button, busy, label) {
      if (!button) return;

      if (busy) {
        if (!button.dataset.originalHtml) {
          button.dataset.originalHtml = button.innerHTML;
        }
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.textContent = label;
        return;
      }

      button.disabled = false;
      button.removeAttribute('aria-busy');

      if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
        delete button.dataset.originalHtml;
      }
    }
  }
})();
