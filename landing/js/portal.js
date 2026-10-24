/**
 * LicitaciónYa — B2B Client Portal Controller
 * Manages customer preferences, notifications, filters & report downloads
 */

const DEFAULT_KEYWORDS = [
  "cemento", "hormigón", "acero", "varilla", "malla electrosoldada",
  "perfil de hierro", "viga", "pintura", "impermeabilizante", "tubería",
  "tubo pvc", "hidrosanitario", "grifería", "plancha metálica", "soldadura",
  "electrodos", "herramientas menores", "ferretería industrial"
];

const DEFAULT_CLIENT = {
  empresa: "Distribuidora Ferretera del Guayas S.A.",
  ruc: "0941822801001",
  whatsapp: "+593 099 123 4567",
  email: "ventas@ferreteraguayas.com",
  rubro: "Ferretería Industrial & Acero",
  plan: "Suscripción Integral B2B ($80/mes + IVA)",
  trialDaysRemaining: 15,
  keywords: [...DEFAULT_KEYWORDS],
  channels: {
    whatsappAlerts: true,
    emailReports: true
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('portal-login-view');
  const dashboardView = document.getElementById('portal-dashboard-view');
  const loginForm = document.getElementById('portal-login-form');
  const logoutBtn = document.getElementById('portal-logout-btn');

  // Check URL params or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const rucParam = urlParams.get('ruc');

  let activeClient = null;

  try {
    const stored = localStorage.getItem('licitacionya_current_client');
    if (stored) {
      activeClient = JSON.parse(stored);
    }
  } catch (e) {
    console.warn(e);
  }

  if (rucParam && (!activeClient || activeClient.ruc !== rucParam)) {
    // Try to find in db
    try {
      const db = JSON.parse(localStorage.getItem('licitacionya_clients_db') || '[]');
      const found = db.find(c => c.ruc === rucParam);
      if (found) {
        activeClient = found;
      }
    } catch (e) {}
  }

  if (activeClient) {
    renderDashboard(activeClient);
  } else {
    showLogin();
  }

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('portal-login-id').value.trim();
      if (!input) return;

      // Check in mock DB or fallback to default client with this RUC
      let foundClient = null;
      try {
        const db = JSON.parse(localStorage.getItem('licitacionya_clients_db') || '[]');
        foundClient = db.find(c => c.ruc.includes(input) || c.whatsapp.includes(input));
      } catch (e) {}

      if (!foundClient) {
        foundClient = {
          ...DEFAULT_CLIENT,
          ruc: input.length === 13 ? input : DEFAULT_CLIENT.ruc,
          empresa: "Empresa Registrada en SERCOP (" + input + ")"
        };
      }

      localStorage.setItem('licitacionya_current_client', JSON.stringify(foundClient));
      renderDashboard(foundClient);
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('licitacionya_current_client');
      showLogin();
    });
  }

  function showLogin() {
    if (loginView) loginView.style.display = 'block';
    if (dashboardView) dashboardView.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    const userTag = document.getElementById('header-user-tag');
    if (userTag) userTag.style.display = 'none';
  }

  function renderDashboard(client) {
    if (loginView) loginView.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';

    const userTag = document.getElementById('header-user-tag');
    if (userTag) {
      userTag.style.display = 'flex';
      userTag.querySelector('.user-company-name').textContent = client.empresa;
    }

    // Populate Hero
    document.getElementById('dash-empresa').textContent = client.empresa;
    document.getElementById('dash-ruc').textContent = client.ruc;
    document.getElementById('dash-rubro').textContent = client.rubro || 'Ferretería Industrial';
    document.getElementById('dash-plan').textContent = client.plan || '$80 USD / mes + IVA';
    document.getElementById('dash-trial-days').textContent = `${client.trialDaysRemaining || 15} Días Restantes`;

    // Populate Channel Inputs
    const waInput = document.getElementById('channel-whatsapp');
    const emailInput = document.getElementById('channel-email');
    if (waInput) waInput.value = client.whatsapp;
    if (emailInput) emailInput.value = client.email;

    // Set Toggles
    const toggleWa = document.getElementById('toggle-whatsapp');
    const toggleEmail = document.getElementById('toggle-email');
    if (toggleWa && client.channels) toggleWa.checked = client.channels.whatsappAlerts !== false;
    if (toggleEmail && client.channels) toggleEmail.checked = client.channels.emailReports !== false;

    // Render Keywords
    const keywords = client.keywords || DEFAULT_KEYWORDS;
    renderKeywords(keywords);

    // Setup Channel Save Buttons
    setupChannelSaves(client);
  }

  function renderKeywords(keywords) {
    const wrap = document.getElementById('keywords-chips-wrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    keywords.forEach((kw, index) => {
      const chip = document.createElement('span');
      chip.className = 'kw-chip';
      chip.innerHTML = `
        <span>${kw}</span>
        <span class="kw-chip-remove" data-index="${index}">&times;</span>
      `;
      wrap.appendChild(chip);
    });

    // Remove keyword handler
    wrap.querySelectorAll('.kw-chip-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        keywords.splice(idx, 1);
        saveKeywords(keywords);
        renderKeywords(keywords);
      });
    });

    // Add keyword handler
    const addBtn = document.getElementById('btn-add-kw');
    const addInput = document.getElementById('input-new-kw');
    if (addBtn && addInput) {
      addBtn.onclick = () => {
        const val = addInput.value.trim().toLowerCase();
        if (val && !keywords.includes(val)) {
          keywords.push(val);
          saveKeywords(keywords);
          renderKeywords(keywords);
          addInput.value = '';
        }
      };
    }
  }

  function saveKeywords(keywords) {
    try {
      const client = JSON.parse(localStorage.getItem('licitacionya_current_client') || '{}');
      client.keywords = keywords;
      localStorage.setItem('licitacionya_current_client', JSON.stringify(client));
    } catch (e) {}
  }

  function setupChannelSaves(client) {
    const saveWaBtn = document.getElementById('btn-save-wa');
    const saveEmailBtn = document.getElementById('btn-save-email');
    const toggleWa = document.getElementById('toggle-whatsapp');
    const toggleEmail = document.getElementById('toggle-email');

    if (saveWaBtn) {
      saveWaBtn.onclick = () => {
        const val = document.getElementById('channel-whatsapp').value.trim();
        client.whatsapp = val;
        persistClient(client);
        showFeedback('feedback-wa');
      };
    }

    if (saveEmailBtn) {
      saveEmailBtn.onclick = () => {
        const val = document.getElementById('channel-email').value.trim();
        client.email = val;
        persistClient(client);
        showFeedback('feedback-email');
      };
    }

    if (toggleWa) {
      toggleWa.onchange = () => {
        if (!client.channels) client.channels = {};
        client.channels.whatsappAlerts = toggleWa.checked;
        persistClient(client);
      };
    }

    if (toggleEmail) {
      toggleEmail.onchange = () => {
        if (!client.channels) client.channels = {};
        client.channels.emailReports = toggleEmail.checked;
        persistClient(client);
      };
    }
  }

  function showFeedback(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 2500);
  }

  function persistClient(client) {
    try {
      localStorage.setItem('licitacionya_current_client', JSON.stringify(client));
    } catch (e) {}
  }
});
