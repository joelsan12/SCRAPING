/**
 * LicitaciónYa — Interactive Features Module (ES Module)
 * Handles Radar filtering & Industry selector
 */

export function initInteractive() {
  initRadarFilter();
  initIndustrySelector();
}

/**
 * Filter radar items by procurement phase
 */
function initRadarFilter() {
  const tabs = document.querySelectorAll('.radar-tab');
  const items = document.querySelectorAll('.radar-item');

  if (!tabs.length || !items.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;

      // Update active tab style
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Filter tender items
      items.forEach(item => {
        const phase = item.dataset.phase;
        if (filter === 'all' || phase === filter) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
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
    sampleCode: 'LICO-CEE-2024-001 • Pichincha',
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
    sampleCode: 'COTO-GADMUR-2024-001 • Pichincha',
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
    sampleCode: 'CE-20240002558712 • Tungurahua',
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
    sampleCode: 'CE-20240002562764 • Guayas',
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
