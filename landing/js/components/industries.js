/**
 * LicitaciónYa — Calibración de Sectores B2B (Componente Modular)
 */
import { INDUSTRIES_DATA } from '../data/industries.js';

export function initIndustries() {
  const buttons = document.querySelectorAll('.industry-btn');
  const card = document.getElementById('industry-active-card');

  if (!buttons.length || !card) return;

  const topSectorEl = card.querySelector('#industry-top-sector');
  const titleEl = card.querySelector('.industry-title');
  const descEl = card.querySelector('.industry-desc');
  const cpcTextEl = card.querySelector('#cpc-badge-text');
  const tagsContainer = card.querySelector('.industry-tags');
  const sampleTitleEl = card.querySelector('.sample-tender-title');
  const sampleEntityEl = card.querySelector('#sample-entity-text') || card.querySelector('.sample-entity-text');
  const sampleCodeEl = card.querySelector('#sample-code-text');
  const samplePhaseBadge = card.querySelector('#sample-phase-badge');
  const samplePhaseTextEl = card.querySelector('#sample-phase-text');
  const sampleAmountEl = card.querySelector('#sample-amount-text') || card.querySelector('.sample-amount');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const industryKey = btn.dataset.industry;
      const data = INDUSTRIES_DATA[industryKey];
      if (!data) return;

      // Update active button state
      buttons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update DOM
      if (topSectorEl && data.sectorName) topSectorEl.textContent = data.sectorName;
      if (titleEl) titleEl.textContent = data.title;
      if (descEl) descEl.textContent = data.description;
      if (cpcTextEl) cpcTextEl.textContent = `${data.cpcCode} · ${data.cpcName}`;
      if (sampleTitleEl) sampleTitleEl.textContent = data.sampleTitle;
      if (sampleCodeEl) sampleCodeEl.textContent = data.sampleCode;
      if (sampleEntityEl) sampleEntityEl.textContent = `${data.sampleEntity} · ${data.sampleProvince || 'Ecuador'}`;
      if (sampleAmountEl) sampleAmountEl.textContent = data.sampleAmount;

      // Phase badge indicator
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

      // Keyword tags
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
