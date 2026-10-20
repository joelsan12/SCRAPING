/**
 * LicitaciónYa — Interactive Features Module (ES Module)
 * Handles Radar filtering, pagination, search, drawers, Excel sheet preview, & Industry selector
 */

export function initInteractive() {
  initRadar();
  initExcelSheetTabs();
  initIndustrySelector();
}

/**
 * Executive Procurement Radar: Filter, Search, Pagination, & Expandable Drawers
 */
function initRadar() {
  const container = document.getElementById('radar');
  if (!container) return;

  const tabs = container.querySelectorAll('.radar-tab');
  const searchInput = container.getElementById ? container.getElementById('radar-search-input') : document.getElementById('radar-search-input');
  const searchClear = document.getElementById('radar-search-clear');
  const items = Array.from(container.querySelectorAll('.radar-item'));
  const prevBtn = document.getElementById('radar-prev-btn');
  const nextBtn = document.getElementById('radar-next-btn');
  const shownEl = document.getElementById('radar-nav-shown');
  const totalEl = document.getElementById('radar-nav-total');
  const footerStatEl = document.getElementById('radar-footer-stat');
  const countAllEl = document.getElementById('radar-tab-all-count');
  const countOpenEl = document.getElementById('radar-tab-open-count');
  const countRecentEl = document.getElementById('radar-tab-recent-count');

  if (!items.length) return;

  let currentFilter = 'all';
  let searchQuery = '';
  let currentPage = 1;
  const pageSize = 4;

  // Update initial tab count indicators
  const totalOpen = items.filter(i => i.dataset.phase === 'open').length;
  const totalRecent = items.filter(i => i.dataset.phase === 'recent').length;
  if (countAllEl) countAllEl.textContent = items.length;
  if (countOpenEl) countOpenEl.textContent = totalOpen;
  if (countRecentEl) countRecentEl.textContent = totalRecent;

  function render() {
    // 1. Filter matching items
    const query = searchQuery.trim().toLowerCase();
    const matching = items.filter(item => {
      const phase = item.dataset.phase;
      const matchesFilter = (currentFilter === 'all' || phase === currentFilter);
      if (!matchesFilter) return false;

      if (!query) return true;
      const keywords = (item.dataset.keywords || '').toLowerCase();
      const text = item.textContent.toLowerCase();
      return keywords.includes(query) || text.includes(query);
    });

    // 2. Pagination calculations
    const totalMatching = matching.length;
    const totalPages = Math.max(1, Math.ceil(totalMatching / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalMatching);

    // 3. Update visibility
    items.forEach(item => {
      const matchIdx = matching.indexOf(item);
      if (matchIdx >= startIndex && matchIdx < endIndex) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });

    // 4. Update pagination controls
    if (shownEl) {
      shownEl.textContent = totalMatching > 0 ? `${startIndex + 1} - ${endIndex}` : '0';
    }
    if (totalEl) {
      totalEl.textContent = totalMatching;
    }
    if (prevBtn) {
      prevBtn.disabled = (currentPage <= 1);
    }
    if (nextBtn) {
      nextBtn.disabled = (currentPage >= totalPages);
    }

    // 5. Update footer statistics dynamically
    if (footerStatEl) {
      if (currentFilter === 'open') {
        footerStatEl.textContent = `${totalMatching} en Convocatoria Abierta (~$2.8M USD)`;
      } else if (currentFilter === 'recent') {
        footerStatEl.textContent = `${totalMatching} Adjudicadas recientemente (~$1.2M USD)`;
      } else {
        footerStatEl.textContent = '75% en Convocatoria Abierta ($2.8M USD)';
      }
    }
  }

  // Segmented control tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter || 'all';
      currentPage = 1;
      render();
    });
  });

  // Search input with live debouncing
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClear) {
        searchClear.style.display = searchQuery ? 'inline-block' : 'none';
      }
      currentPage = 1;
      render();
    });
  }

  if (searchClear && searchInput) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClear.style.display = 'none';
      currentPage = 1;
      render();
      searchInput.focus();
    });
  }

  // Pagination button handlers
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        render();
        const list = document.getElementById('radar-items-container');
        if (list) list.scrollTop = 0;
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage++;
      render();
      const list = document.getElementById('radar-items-container');
      if (list) list.scrollTop = 0;
    });
  }

  // Row Expand / Collapse & Copy Code Event Delegation
  const listContainer = document.getElementById('radar-items-container');
  if (listContainer) {
    listContainer.addEventListener('click', (e) => {
      // Handle copy button click
      const copyBtn = e.target.closest('.btn-drawer-copy');
      if (copyBtn) {
        e.stopPropagation();
        const code = copyBtn.dataset.copy || '';
        if (navigator.clipboard && code) {
          navigator.clipboard.writeText(code).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '¡Copiado!';
            copyBtn.style.color = '#059669';
            setTimeout(() => {
              copyBtn.textContent = originalText;
              copyBtn.style.color = '';
            }, 1800);
          });
        }
        return;
      }

      // Do not toggle row if clicking WhatsApp link
      if (e.target.closest('a')) return;

      // Toggle expandable row drawer
      const item = e.target.closest('.radar-item');
      if (item) {
        const isExpanded = item.classList.contains('expanded');
        item.classList.toggle('expanded');
        const hint = item.querySelector('.expand-hint');
        if (hint) {
          hint.innerHTML = isExpanded ? 'Ver pliego &darr;' : 'Ocultar &uarr;';
        }
      }
    });
  }

  // Initial render
  render();
}

/**
 * Deliverables Section: Interactive Excel Sheet Tabs
 */
const EXCEL_SHEETS = {
  oportunidades: {
    headers: ['Código Real', 'Entidad Contratante', 'Presupuesto USD', 'Provincia', 'Fase'],
    rows: [
      ['LICO-CEE-2026-004', 'Cuerpo de Ingenieros del Ejército', '$994,289.69', 'Pichincha', '<span class="badge-phase badge-open">Abierta</span>'],
      ['CE-20260002891410', 'Empresa Eléctrica Ambato', '$732,152.96', 'Tungurahua', '<span class="badge-phase badge-open">Abierta</span>'],
      ['CE-20260002914520', 'CNEL EP Guayaquil', '$350,393.12', 'Guayas', '<span class="badge-phase badge-recent">Adjudicada</span>'],
      ['COTO-GADMUR-2026-002', 'GAD Municipal de Rumiñahui', '$286,062.01', 'Pichincha', '<span class="badge-phase badge-open">Abierta</span>']
    ],
    footer: 'Incluye hoja adicional de <strong>Resumen Geográfico y Análisis por Entidad</strong> para planificar despachos.'
  },
  geografico: {
    headers: ['Provincia', 'Procesos Detectados', 'Monto Acumulado USD', 'Entidad Principal', 'Estado Predominante'],
    rows: [
      ['Pichincha', '3 procesos', '$1,475,782.20', 'Cuerpo de Ingenieros', '<span class="badge-phase badge-open">Convocatoria Abierta</span>'],
      ['Tungurahua', '1 proceso', '$732,152.96', 'Empresa Eléctrica Ambato', '<span class="badge-phase badge-open">Convocatoria Abierta</span>'],
      ['Guayas', '2 procesos', '$513,143.12', 'CNEL EP Guayaquil', '<span class="badge-phase badge-open">1 Abierta / 1 Adj.</span>'],
      ['Azuay', '1 proceso', '$845,610.20', 'CELEC EP Termopichincha', '<span class="badge-phase badge-recent">Adjudicada</span>']
    ],
    footer: 'Filtro territorial para optimizar viáticos, logística de entrega técnica y cobertura de su fuerza comercial.'
  },
  entidad: {
    headers: ['Entidad Contratante', 'Sector Institucional', 'Frecuencia de Compra', 'Presupuesto Promedio', 'Historial SERCOP'],
    rows: [
      ['Cuerpo de Ingenieros', 'Defensa / Infraestructura', 'Mensual', '$850,000 USD', '<span class="badge-phase badge-open">Alta Confiabilidad</span>'],
      ['EEASA Ambato', 'Empresa Pública Eléctrica', 'Trimestral', '$680,000 USD', '<span class="badge-phase badge-open">Pago Oportuno</span>'],
      ['CNEL EP Guayaquil', 'Distribución Energética', 'Quincenal', '$420,000 USD', '<span class="badge-phase badge-open">Gran Volumen</span>'],
      ['GAD Rumiñahui', 'Municipal / Vialidad', 'Bimestral', '$285,000 USD', '<span class="badge-phase badge-open">Obras Locales</span>']
    ],
    footer: 'Perfil de comprador del Estado: historial de pliegos, presupuestos anuales y adjudicaciones previas.'
  }
};

function initExcelSheetTabs() {
  const tabs = document.querySelectorAll('.excel-sheet-tab');
  const table = document.querySelector('.excel-preview-table');
  const footer = document.querySelector('.excel-card-footer');

  if (!tabs.length || !table) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const sheetKey = tab.dataset.sheet;
      const data = EXCEL_SHEETS[sheetKey];
      if (!data) return;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update table thead
      const thead = table.querySelector('thead');
      if (thead) {
        thead.innerHTML = `<tr>${data.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
      }

      // Update table tbody
      const tbody = table.querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = data.rows.map(row => {
          return `<tr>
            <td class="font-mono text-link">${row[0]}</td>
            <td>${row[1]}</td>
            <td class="text-right font-bold text-success">${row[2]}</td>
            <td>${row[3]}</td>
            <td>${row[4]}</td>
          </tr>`;
        }).join('');
      }

      // Update footer
      if (footer && data.footer) {
        footer.innerHTML = `<span>${data.footer}</span>`;
      }
    });
  });
}

/**
 * Interactive Industry / Rubro Data and Switching
 */
const INDUSTRY_DATA = {
  ferreteria: {
    title: 'Ferretería Industrial y Suministros Mecánicos',
    description: 'Monitoreo de adquisiciones para talleres del Estado, Fuerzas Armadas, empresas públicas de agua y mantenimiento municipal.',
    cpc: 'CPC 42921 • Herramientas y Artículos de Ferretería',
    tags: ['pernos alta resistencia', 'discos de corte', 'soldadura 7018', 'herramientas eléctricas', 'rodamientos', 'seguridad industrial'],
    sampleTitle: 'ADQUISICIÓN DE HERRAMIENTAS, PERFILES Y SUMINISTROS DE TALLER',
    sampleEntity: 'Cuerpo de Ingenieros del Ejército',
    sampleCode: 'LICO-CEE-2026-004 • Pichincha',
    sampleAmount: '$994,289.69 USD',
    samplePhase: 'Convocatoria Abierta',
    waTopic: 'Ferretería Industrial'
  },
  construccion: {
    title: 'Materiales de Construcción y Obra Civil',
    description: 'Detección de procesos de pavimentación, muros de contención, infraestructura vial y edificaciones públicas de GADs y ministerios.',
    cpc: 'CPC 37510 • Cemento, Áridos y Hormigón',
    tags: ['cemento portland', 'varilla corrugada', 'asfalto', 'adoquines', 'geomembrana', 'perfiles estructurales'],
    sampleTitle: 'SUMINISTRO DE MATERIALES PÉTREOS, ASFALTO Y CEMENTO PARA VIALIDAD',
    sampleEntity: 'GAD Municipal de Rumiñahui',
    sampleCode: 'COTO-GADMUR-2026-002 • Pichincha',
    sampleAmount: '$286,062.01 USD',
    samplePhase: 'Convocatoria Abierta',
    waTopic: 'Materiales de Construcción'
  },
  electrico: {
    title: 'Redes Eléctricas, Distribución y Transformadores',
    description: 'Alertas de licitaciones de CNEL, CELEC y empresas eléctricas provinciales para líneas de media y baja tensión.',
    cpc: 'CPC 46211 • Conductores, Cables y Transformadores',
    tags: ['transformadores trifásicos', 'cable de cobre', 'conductor de aluminio', 'seccionadores', 'aisladores poliméricos', 'luminarias LED'],
    sampleTitle: 'SUMINISTRO DE CONDUCTORES DE ALUMINIO Y TRANSFORMADORES DE DISTRIBUCIÓN',
    sampleEntity: 'Empresa Eléctrica Ambato (EEASA)',
    sampleCode: 'CE-20260002891410 • Tungurahua',
    sampleAmount: '$732,152.96 USD',
    samplePhase: 'Convocatoria Abierta',
    waTopic: 'Redes Eléctricas'
  },
  sanitario: {
    title: 'Tubería, Válvulas y Saneamiento de Agua Potable',
    description: 'Monitoreo de compras públicas para empresas municipales de agua potable (EPMAPS, EMAPAG, etc.) y juntas parroquiales.',
    cpc: 'CPC 36320 • Tuberías de Plástico y Válvulas',
    tags: ['tubería PEAD', 'tubería PVC unión Z', 'válvulas compuerta', 'medidores de agua', 'accesorios hierro fundido', 'hidrantes'],
    sampleTitle: 'ADQUISICIÓN DE TUBERÍA PVC PRESIÓN Y ACCESORIOS PARA RED MATRIZ',
    sampleEntity: 'CNEL EP Guayaquil / EPMAPS',
    sampleCode: 'CE-20260002914520 • Guayas',
    sampleAmount: '$350,393.12 USD',
    samplePhase: 'Adjudicada',
    waTopic: 'Tubería y Saneamiento'
  }
};

function initIndustrySelector() {
  const buttons = document.querySelectorAll('.industry-btn');
  const card = document.getElementById('industry-active-card');

  if (!buttons.length || !card) return;

  const titleEl = card.querySelector('.industry-title');
  const descEl = card.querySelector('.industry-desc');
  const cpcEl = card.querySelector('.industry-cpc-badge');
  const tagsContainer = card.querySelector('.industry-tags');
  const sampleTitleEl = card.querySelector('.sample-tender-title');
  const sampleEntityEl = card.querySelector('.sample-entity-text');
  const sampleAmountEl = card.querySelector('.sample-amount');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const industryKey = btn.dataset.industry;
      const data = INDUSTRY_DATA[industryKey];

      if (!data) return;

      // Update button active state
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update card content
      if (titleEl) titleEl.textContent = data.title;
      if (descEl) descEl.textContent = data.description;
      if (cpcEl) cpcEl.textContent = data.cpc;
      if (sampleTitleEl) sampleTitleEl.textContent = data.sampleTitle;
      if (sampleEntityEl) sampleEntityEl.textContent = `${data.sampleEntity} • ${data.sampleCode}`;
      if (sampleAmountEl) sampleAmountEl.textContent = data.sampleAmount;

      // Update tags
      if (tagsContainer) {
        tagsContainer.innerHTML = '';
        data.tags.forEach(tag => {
          const span = document.createElement('span');
          span.className = 'industry-tag';
          span.textContent = tag;
          tagsContainer.appendChild(span);
        });
      }
    });
  });
}
