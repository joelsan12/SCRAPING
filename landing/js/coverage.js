/**
 * LicitaciónYa — Cobertura por sector
 * Cambia el panel de calibración sin recargar la página.
 */

const SECTORS = {
  ferreteria: {
    num: '01',
    title: 'Ferretería y suministros industriales',
    desc: 'Tornillería, herramienta, soldadura, seguridad industrial y materiales de mantenimiento para entidades públicas, talleres y empresas de servicios.',
    tags: [
      'pernos alta resistencia',
      'discos de corte',
      'soldadura 7018',
      'herramientas eléctricas',
      'rodamientos',
      'seguridad industrial'
    ],
    coverage: 'Nacional, con priorización por provincia acordada.'
  },
  construccion: {
    num: '02',
    title: 'Materiales de construcción y obra civil',
    desc: 'Cemento, áridos, acero estructural, pavimentos, adoquines y materiales para infraestructura vial, edificaciones y obra pública.',
    tags: [
      'cemento portland',
      'varilla corrugada',
      'asfalto',
      'adoquines',
      'geomembrana',
      'perfiles estructurales'
    ],
    coverage: 'Nacional, con priorización por provincia acordada.'
  },
  electrico: {
    num: '03',
    title: 'Redes eléctricas y distribución',
    desc: 'Transformadores, cable de cobre, conductores, seccionadores, luminarias LED y materiales para mantenimiento de redes de media y baja tensión.',
    tags: [
      'transformadores trifásicos',
      'cable de cobre',
      'conductor de aluminio',
      'seccionadores',
      'aisladores poliméricos',
      'luminarias LED'
    ],
    coverage: 'Nacional, con priorización por provincia acordada.'
  },
  sanitario: {
    num: '04',
    title: 'Tubería, válvulas y saneamiento',
    desc: 'Tubería PEAD y PVC, válvulas, medidores de agua, hidrantes y accesorios para empresas municipales de agua potable y alcantarillado.',
    tags: [
      'tubería PEAD',
      'tubería PVC unión Z',
      'válvulas compuerta',
      'medidores de agua',
      'accesorios hierro fundido',
      'hidrantes'
    ],
    coverage: 'Nacional, con priorización por provincia acordada.'
  }
};

export function initCoverage() {
  const tabs = Array.from(document.querySelectorAll('[data-sector]'));
  const panel = document.getElementById('sector-panel');

  if (!tabs.length || !panel) return;

  const indexEl = document.getElementById('sector-index');
  const titleEl = document.getElementById('sector-title');
  const descEl = document.getElementById('sector-desc');
  const tagsEl = document.getElementById('sector-tags');
  const coverageEl = document.getElementById('sector-coverage');

  function render(key, activeButton) {
    const data = SECTORS[key];
    if (!data) return;

    tabs.forEach((tab) => {
      const isActive = tab === activeButton;
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.tabIndex = isActive ? 0 : -1;
    });

    if (indexEl) indexEl.textContent = `Sector ${data.num} / 04`;
    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.desc;
    if (coverageEl) coverageEl.textContent = data.coverage;
    panel.setAttribute('aria-labelledby', activeButton.id);

    if (tagsEl) {
      tagsEl.replaceChildren(
        ...data.tags.map((tag) => {
          const span = document.createElement('span');
          span.className = 'tag';
          span.textContent = tag;
          return span;
        })
      );
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => render(tab.dataset.sector, tab));

    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();

      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (index + direction + tabs.length) % tabs.length;
      const nextTab = tabs[nextIndex];
      nextTab.focus();
      nextTab.click();
    });
  });
}
