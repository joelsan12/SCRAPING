/**
 * LicitaciónYa — Radar de Contrataciones SERCOP (Componente Modular)
 */
import { TENDERS_DATA } from '../data/tenders.js';

export function initRadar() {
  const container = document.getElementById('radar');
  const itemsContainer = document.getElementById('radar-items-container');
  if (!container || !itemsContainer) return;

  const tabs = container.querySelectorAll('.radar-tab');
  const searchInput = document.getElementById('radar-search-input');
  const searchClear = document.getElementById('radar-search-clear');

  let currentFilter = 'all';
  let searchQuery = '';

  // Render items dynamically from TENDERS_DATA
  function renderTenders() {
    const q = searchQuery.trim().toLowerCase();

    const filtered = TENDERS_DATA.filter(item => {
      const matchesPhase = (currentFilter === 'all' || item.phase === currentFilter);
      if (!matchesPhase) return false;
      if (!q) return true;

      const fullSearch = `${item.entity} ${item.code} ${item.province} ${item.cpc} ${item.keywords}`.toLowerCase();
      return fullSearch.includes(q);
    });

    if (filtered.length === 0) {
      itemsContainer.innerHTML = `
        <div class="radar-empty-state" style="padding: 2rem; text-align: center; color: var(--text-muted, #64748b);">
          <p>No se encontraron procesos que coincidan con su búsqueda.</p>
        </div>
      `;
      return;
    }

    itemsContainer.innerHTML = filtered.map(item => `
      <div class="radar-item" data-phase="${item.phase}" data-keywords="${item.keywords}">
        <div class="radar-item-main">
          <div class="radar-item-left">
            <span class="radar-entity">${item.entity}</span>
            <div class="radar-meta">
              <span class="code-pill">${item.code}</span>
              <span>• ${item.province}</span>
              <span class="cpc-pill">${item.cpc}</span>
            </div>
          </div>
          <div class="radar-item-right">
            <span class="radar-amount">${item.amount}</span>
            <div class="badge-wrapper">
              <span class="badge-phase badge-${item.phase}">
                <span class="dot-indicator dot-${item.phase}"></span>
                ${item.phaseText}
              </span>
              <a href="${item.actionUrl}" class="link-pliego">${item.actionText}</a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Segmented control tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter || 'all';
      renderTenders();
    });
  });

  // Search input with live filtering
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClear) {
        searchClear.style.display = searchQuery ? 'inline-block' : 'none';
      }
      renderTenders();
    });
  }

  // Clear search button
  if (searchClear && searchInput) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClear.style.display = 'none';
      renderTenders();
      searchInput.focus();
    });
  }

  // Initial render
  renderTenders();
}
