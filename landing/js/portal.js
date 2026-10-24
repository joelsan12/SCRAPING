/**
 * LicitaciónYa — B2B Client Portal Controller (Sin datos ficticios)
 * Autenticación mediante RUC + últimos 4 dígitos del WhatsApp
 */

const RUBRO_KEYWORDS = {
  ferreteria: [
    "pernos alta resistencia", "discos de corte", "soldadura 7018", "herramientas eléctricas",
    "rodamientos", "seguridad industrial", "plancha galvanizada", "electrodos"
  ],
  construccion: [
    "cemento portland", "varilla corrugada", "asfalto", "adoquines",
    "geomembrana", "perfiles estructurales", "áridos", "malla electrosoldada"
  ],
  electrico: [
    "transformadores trifásicos", "cable de cobre", "conductor de aluminio",
    "seccionadores", "aisladores poliméricos", "luminarias LED", "tableros eléctricos"
  ],
  hidrosanitario: [
    "tubería PEAD", "tubería PVC unión Z", "válvulas compuerta",
    "medidores de agua", "accesorios hierro fundido", "hidrantes", "bombas centrífugas"
  ],
  medico: [
    "insumos médicos", "gasas", "catéteres", "reactivos químicos", "fármacos", "material quirúrgico"
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('portal-login-view');
  const dashboardView = document.getElementById('portal-dashboard-view');
  const loginForm = document.getElementById('portal-login-form');
  const logoutBtn = document.getElementById('portal-logout-btn');
  const loginErrorBox = document.getElementById('portal-login-error');

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

  // Si viene con parámetro RUC y ya coincide con la sesión guardada
  if (rucParam && activeClient && activeClient.ruc === rucParam) {
    renderDashboard(activeClient);
  } else if (activeClient) {
    renderDashboard(activeClient);
  } else {
    showLogin();
  }

  // Handle Login con RUC + últimos 4 dígitos del WhatsApp
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (loginErrorBox) loginErrorBox.style.display = 'none';

      const rucInput = document.getElementById('portal-login-ruc');
      const phone4Input = document.getElementById('portal-login-phone4');
      const submitBtn = document.getElementById('btn-submit-portal-login');

      const ruc = rucInput ? rucInput.value.trim().replace(/\D/g, '') : '';
      const phone4 = phone4Input ? phone4Input.value.trim().replace(/\D/g, '') : '';

      if (ruc.length !== 13) {
        showError('El RUC debe contener exactamente 13 dígitos numéricos.');
        return;
      }

      if (phone4.length !== 4) {
        showError('Ingrese los últimos 4 dígitos del número de WhatsApp registrado.');
        return;
      }

      let foundClient = null;

      // 1. Intentar validar en base de datos local
      try {
        const db = JSON.parse(localStorage.getItem('licitacionya_clients_db') || '[]');
        foundClient = db.find(c => {
          const cRuc = (c.ruc || '').replace(/\D/g, '');
          const cPhone = (c.whatsapp || '').replace(/\D/g, '');
          const cPhone4 = c.phoneLast4 || cPhone.slice(-4);
          return cRuc === ruc && cPhone4 === phone4;
        });
      } catch (err) {
        console.warn('Error leyendo local storage:', err);
      }

      // 2. Si no está en local, consultar /api/client
      if (!foundClient) {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>Verificando identidad...</span>';
        }

        try {
          const res = await fetch('/api/client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ruc, phone4 })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.client) {
              foundClient = data.client;
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            showError(errData.error || 'RUC o últimos 4 dígitos no coinciden con un registro activo.');
            return;
          }
        } catch (netErr) {
          console.info('No se pudo conectar con la API /api/client en entorno local:', netErr.message);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Ingresar a Mi Panel</span>';
          }
        }
      }

      if (foundClient) {
        localStorage.setItem('licitacionya_current_client', JSON.stringify(foundClient));
        renderDashboard(foundClient);
      } else {
        showError('No se encontró ninguna empresa registrada con ese RUC y celular. Por favor verifique sus datos o active su prueba gratis.');
      }
    });
  }

  function showError(msg) {
    if (!loginErrorBox) return;
    loginErrorBox.textContent = msg;
    loginErrorBox.style.display = 'block';
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
  }

  function renderDashboard(client) {
    if (!client) return;

    if (loginView) loginView.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';

    // Top Profile Info
    const dashEmpresa = document.getElementById('dash-empresa');
    const dashRuc = document.getElementById('dash-ruc');
    const dashRubro = document.getElementById('dash-rubro');
    const dashPlan = document.getElementById('dash-plan');
    const dashTrialDays = document.getElementById('dash-trial-days');

    if (dashEmpresa) dashEmpresa.textContent = client.empresa || 'Empresa Registrada';
    if (dashRuc) dashRuc.textContent = client.ruc || '-';
    if (dashRubro) dashRubro.textContent = client.rubro || 'Suministros Comerciales';
    if (dashPlan) dashPlan.textContent = client.plan || 'Suscripción B2B ($80/mes + IVA)';
    if (dashTrialDays) dashTrialDays.textContent = `${client.trialDaysRemaining ?? 15} Días Restantes`;

    // Channels Inputs
    const waInput = document.getElementById('channel-whatsapp');
    const emailInput = document.getElementById('channel-email');

    if (waInput && client.whatsapp) waInput.value = client.whatsapp;
    if (emailInput && client.email) emailInput.value = client.email;

    // Load Keywords
    let keywords = client.keywords;
    if (!keywords || !keywords.length) {
      const rubroKey = (client.rubro || '').toLowerCase();
      if (rubroKey.includes('ferreter')) keywords = RUBRO_KEYWORDS.ferreteria;
      else if (rubroKey.includes('construc')) keywords = RUBRO_KEYWORDS.construccion;
      else if (rubroKey.includes('electr')) keywords = RUBRO_KEYWORDS.electrico;
      else if (rubroKey.includes('hidro') || rubroKey.includes('tuber')) keywords = RUBRO_KEYWORDS.hidrosanitario;
      else if (rubroKey.includes('medic') || rubroKey.includes('farm')) keywords = RUBRO_KEYWORDS.medico;
      else keywords = RUBRO_KEYWORDS.ferreteria;
      client.keywords = [...keywords];
    }

    renderKeywords(client.keywords);

    // Setup Save Handlers
    setupDashboardActions(client);
  }

  function renderKeywords(keywords) {
    const wrap = document.getElementById('keywords-chips-wrap');
    if (!wrap) return;

    wrap.innerHTML = '';
    keywords.forEach((kw, index) => {
      const chip = document.createElement('div');
      chip.className = 'kw-chip';
      chip.innerHTML = `
        <span>${kw}</span>
        <button type="button" class="kw-remove-btn" data-index="${index}" title="Eliminar filtro">&times;</button>
      `;
      wrap.appendChild(chip);
    });

    wrap.querySelectorAll('.kw-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        keywords.splice(idx, 1);
        renderKeywords(keywords);
        saveCurrentClientKeywords(keywords);
      });
    });
  }

  function saveCurrentClientKeywords(keywords) {
    try {
      const stored = localStorage.getItem('licitacionya_current_client');
      if (stored) {
        const c = JSON.parse(stored);
        c.keywords = keywords;
        localStorage.setItem('licitacionya_current_client', JSON.stringify(c));
      }
    } catch (e) {}
  }

  function setupDashboardActions(client) {
    // Save WhatsApp Channel
    const btnSaveWa = document.getElementById('btn-save-wa');
    const waInput = document.getElementById('channel-whatsapp');
    const feedbackWa = document.getElementById('feedback-wa');

    if (btnSaveWa && waInput) {
      btnSaveWa.onclick = () => {
        client.whatsapp = waInput.value.trim();
        saveClient(client);
        if (feedbackWa) {
          feedbackWa.style.display = 'block';
          setTimeout(() => { feedbackWa.style.display = 'none'; }, 2500);
        }
      };
    }

    // Save Email Channel
    const btnSaveEmail = document.getElementById('btn-save-email');
    const emailInput = document.getElementById('channel-email');
    const feedbackEmail = document.getElementById('feedback-email');

    if (btnSaveEmail && emailInput) {
      btnSaveEmail.onclick = () => {
        client.email = emailInput.value.trim();
        saveClient(client);
        if (feedbackEmail) {
          feedbackEmail.style.display = 'block';
          setTimeout(() => { feedbackEmail.style.display = 'none'; }, 2500);
        }
      };
    }

    // Add New Keyword
    const btnAddKw = document.getElementById('btn-add-kw');
    const inputNewKw = document.getElementById('input-new-kw');

    if (btnAddKw && inputNewKw) {
      btnAddKw.onclick = () => {
        const val = inputNewKw.value.trim();
        if (val && !client.keywords.includes(val)) {
          client.keywords.push(val);
          renderKeywords(client.keywords);
          saveClient(client);
          inputNewKw.value = '';
        }
      };
      inputNewKw.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btnAddKw.click();
        }
      };
    }
  }

  function saveClient(client) {
    try {
      localStorage.setItem('licitacionya_current_client', JSON.stringify(client));
      const db = JSON.parse(localStorage.getItem('licitacionya_clients_db') || '[]');
      const filtered = db.filter(c => c.ruc !== client.ruc);
      filtered.push(client);
      localStorage.setItem('licitacionya_clients_db', JSON.stringify(filtered));
    } catch (e) {
      console.warn('Error guardando cliente:', e);
    }
  }
});
