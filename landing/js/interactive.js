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
      ['SIE-CELECEP-2026-04070-238940', 'CELEC EP — Termopichincha', '$1,750,208.57', 'Pichincha', '<span class="badge-phase badge-open">Abierta</span>'],
      ['LICO-EEASA-2026-010-3233', 'Empresa Eléctrica Ambato (EEASA)', '$115,753.64', 'Tungurahua', '<span class="badge-phase badge-open">Abierta</span>'],
      ['LICS-CNELEP-2026-006-462114', 'CNEL EP — Guayaquil', '$785,783.20', 'Guayas', '<span class="badge-phase badge-open">Abierta</span>'],
      ['CE-20260002974757-741823', 'EPMMOP — Quito', '$97,324.98', 'Pichincha', '<span class="badge-phase badge-recent">Adjudicada</span>']
    ],
    footer: 'Incluye hoja adicional de <strong>Resumen Geográfico y Análisis por Entidad</strong> para planificar despachos.'
  },
  geografico: {
    headers: ['Provincia', 'Procesos Detectados', 'Monto Acumulado USD', 'Entidad Principal', 'Estado Predominante'],
    rows: [
      ['Pichincha', '2 procesos', '$1,847,533.55', 'CELEC EP', '<span class="badge-phase badge-open">1 Abierta / 1 Adj.</span>'],
      ['Tungurahua', '1 proceso', '$115,753.64', 'Empresa Eléctrica Ambato', '<span class="badge-phase badge-open">Convocatoria Abierta</span>'],
      ['Guayas', '1 proceso', '$785,783.20', 'CNEL EP', '<span class="badge-phase badge-open">Convocatoria Abierta</span>']
    ],
    footer: 'Filtro territorial para optimizar viáticos, logística de entrega técnica y cobertura de su fuerza comercial.'
  },
  entidad: {
    headers: ['Entidad Contratante', 'Sector Institucional', 'Código del Proceso', 'Monto del Proceso', 'Fase'],
    rows: [
      ['CELEC EP — Termopichincha', 'Empresa Pública Eléctrica', 'SIE-CELECEP-2026-04070-238940', '$1,750,208.57', '<span class="badge-phase badge-open">Abierta</span>'],
      ['EEASA', 'Empresa Pública Eléctrica', 'LICO-EEASA-2026-010-3233', '$115,753.64', '<span class="badge-phase badge-open">Abierta</span>'],
      ['CNEL EP — Guayaquil', 'Distribución Energética', 'LICS-CNELEP-2026-006-462114', '$785,783.20', '<span class="badge-phase badge-open">Abierta</span>'],
      ['EPMMOP — Quito', 'Movilidad y Obras Públicas', 'CE-20260002974757-741823', '$97,324.98', '<span class="badge-phase badge-recent">Adjudicada</span>']
    ],
    footer: 'Ficha verificable de la entidad y del proceso de referencia publicado en el registro OCDS del SERCOP.'
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
          const thirdCell = sheetKey === 'entidad'
            ? `<td class="font-mono">${row[2]}</td>`
            : `<td class="text-right font-bold text-success">${row[2]}</td>`;
          const fourthCell = sheetKey === 'entidad'
            ? `<td class="text-right font-bold text-success">${row[3]}</td>`
            : `<td>${row[3]}</td>`;
          return `<tr>
            <td class="font-mono text-link">${row[0]}</td>
            <td>${row[1]}</td>
            ${thirdCell}
            ${fourthCell}
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
    sectorName: 'Ferretería Industrial y Suministros',
    title: 'Ferretería Industrial y Suministros Mecánicos',
    description: 'Monitoreo de adquisiciones para talleres del Estado, Fuerzas Armadas, empresas públicas de agua y mantenimiento municipal.',
    cpcCode: '42921',
    cpcName: 'Herramientas y Artículos de Ferretería',
    cpc: 'CPC 42921 • Herramientas y Artículos de Ferretería',
    tags: ['pernos alta resistencia', 'discos de corte', 'soldadura 7018', 'herramientas eléctricas', 'rodamientos', 'seguridad industrial'],
    sampleTitle: 'ADQUISICIÓN DE MATERIALES DE FERRETERÍA PARA LA UNIDAD DE NEGOCIO TERMOPICHINCHA',
    sampleEntity: 'CELEC EP (Termopichincha)',
    sampleProvince: 'Pichincha',
    sampleCode: 'SIE-CELECEP-2026-04070-238940',
    sampleAmount: '$1,750,208.57 USD',
    samplePhase: 'Convocatoria Abierta',
    waTopic: 'Ferretería Industrial'
  },
  construccion: {
    sectorName: 'Materiales de Construcción y Obra',
    title: 'Materiales de Construcción y Obra Civil',
    description: 'Detección de procesos de pavimentación, muros de contención, infraestructura vial y edificaciones públicas de GADs y ministerios.',
    cpcCode: '37510',
    cpcName: 'Cemento, Áridos y Hormigón',
    cpc: 'CPC 37510 • Cemento, Áridos y Hormigón',
    tags: ['cemento portland', 'varilla corrugada', 'asfalto', 'adoquines', 'geomembrana', 'perfiles estructurales'],
    sampleTitle: 'ADOQUINES HEXAGONALES DE CONCRETO 400 KG/CM2 DE RESISTENCIA',
    sampleEntity: 'EPMMOP',
    sampleProvince: 'Pichincha',
    sampleCode: 'CE-20260002970891-741823',
    sampleAmount: '$231,000.00 USD',
    samplePhase: 'Adjudicada',
    waTopic: 'Materiales de Construcción'
  },
  electrico: {
    sectorName: 'Redes Eléctricas y Transformadores',
    title: 'Redes Eléctricas, Distribución y Transformadores',
    description: 'Alertas de licitaciones de CNEL, CELEC y empresas eléctricas provinciales para líneas de media y baja tensión.',
    cpcCode: '46211',
    cpcName: 'Conductores, Cables y Transformadores',
    cpc: 'CPC 46211 • Conductores, Cables y Transformadores',
    tags: ['transformadores trifásicos', 'cable de cobre', 'conductor de aluminio', 'seccionadores', 'aisladores poliméricos', 'luminarias LED'],
    sampleTitle: 'MANTENIMIENTO DE LÍNEAS Y REDES DE DISTRIBUCIÓN 2026 — GD',
    sampleEntity: 'CNEL EP',
    sampleProvince: 'Guayas',
    sampleCode: 'LICS-CNELEP-2026-006-462114',
    sampleAmount: '$785,783.20 USD',
    samplePhase: 'Convocatoria Abierta',
    waTopic: 'Redes Eléctricas'
  },
  sanitario: {
    sectorName: 'Tubería y Saneamiento',
    title: 'Tubería, Válvulas y Saneamiento de Agua Potable',
    description: 'Monitoreo de compras públicas para empresas municipales de agua potable (EPMAPS, EMAPAG, etc.) y juntas parroquiales.',
    cpcCode: '36320',
    cpcName: 'Tuberías de Plástico y Válvulas',
    cpc: 'CPC 36320 • Tuberías de Plástico y Válvulas',
    tags: ['tubería PEAD', 'tubería PVC unión Z', 'válvulas compuerta', 'medidores de agua', 'accesorios hierro fundido', 'hidrantes'],
    sampleTitle: 'ADQUISICIÓN DE TUBERÍAS Y ACCESORIOS PARA ALCANTARILLADO PLUVIAL',
    sampleEntity: 'GAD San Miguel de Ibarra',
    sampleProvince: 'Imbabura',
    sampleCode: 'SIE-GADM-IBARRA-2026-002-2783',
    sampleAmount: '$129,000.00 USD',
    samplePhase: 'Convocatoria Abierta',
    waTopic: 'Tubería y Saneamiento'
  }
};

function initIndustrySelector() {
  const buttons = document.querySelectorAll('.industry-btn');
  const card = document.getElementById('industry-active-card');

  if (!buttons.length || !card) return;

  const topSectorEl = card.querySelector('#industry-top-sector');
  const titleEl = card.querySelector('.industry-title');
  const descEl = card.querySelector('.industry-desc');
  const cpcTextEl = card.querySelector('#cpc-badge-text');
  const cpcBadgeEl = card.querySelector('.industry-cpc-badge');
  const tagsContainer = card.querySelector('.industry-tags');
  const sampleTitleEl = card.querySelector('.sample-tender-title');
  const sampleEntityEl = card.querySelector('#sample-entity-text') || card.querySelector('.sample-entity-text');
  const sampleCodeEl = card.querySelector('#sample-code-text');
  const samplePhaseBadge = card.querySelector('#sample-phase-badge');
  const samplePhaseTextEl = card.querySelector('#sample-phase-text');
  const sampleAmountEl = card.querySelector('#sample-amount-text') || card.querySelector('.sample-amount');
  const waBtnEl = card.querySelector('#sample-wa-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const industryKey = btn.dataset.industry;
      const data = INDUSTRY_DATA[industryKey];

      if (!data) return;

      // Update button active states and ARIA
      buttons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update card content with subtle animation
      if (topSectorEl && data.sectorName) topSectorEl.textContent = data.sectorName;
      if (titleEl) titleEl.textContent = data.title;
      if (descEl) descEl.textContent = data.description;
      
      if (cpcTextEl) {
        cpcTextEl.textContent = `${data.cpcCode} · ${data.cpcName}`;
      } else if (cpcBadgeEl) {
        cpcBadgeEl.textContent = data.cpc;
      }

      if (sampleTitleEl) sampleTitleEl.textContent = data.sampleTitle;
      if (sampleCodeEl && data.sampleCode) sampleCodeEl.textContent = data.sampleCode;
      
      if (sampleEntityEl) {
        sampleEntityEl.textContent = `${data.sampleEntity} · ${data.sampleProvince || 'Ecuador'}`;
      }
      
      if (sampleAmountEl) sampleAmountEl.textContent = data.sampleAmount;

      // Update phase badge styling & indicator
      if (samplePhaseBadge && samplePhaseTextEl) {
        samplePhaseTextEl.textContent = data.samplePhase;
        if (data.samplePhase === 'Adjudicada') {
          samplePhaseBadge.className = 'sample-phase-pill phase-adjudicada';
          samplePhaseBadge.innerHTML = `<span class="dot-indicator dot-adjudicada"></span><span id="sample-phase-text">${data.samplePhase}</span>`;
        } else {
          samplePhaseBadge.className = 'sample-phase-pill';
          samplePhaseBadge.innerHTML = `<span class="dot-indicator dot-open"></span><span id="sample-phase-text">${data.samplePhase}</span>`;
        }
      }

      // Update WhatsApp action link with tailored rubro message
      if (waBtnEl) {
        const text = encodeURIComponent(`Hola, quisiera recibir alertas de licitaciones del rubro ${data.waTopic} en SERCOP Ecuador`);
        waBtnEl.href = `https://wa.me/593979116551?text=${text}`;
      }

      // Update keyword tags
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

