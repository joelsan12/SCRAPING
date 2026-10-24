/**
 * LicitaciónYa — Previsualización de Entregables Excel (Componente Modular)
 */
import { EXCEL_SHEETS_DATA } from '../data/excel-sheets.js';

export function initExcelPreview() {
  const tabs = document.querySelectorAll('.excel-sheet-tab');
  const table = document.querySelector('.excel-preview-table');
  const footer = document.querySelector('.excel-card-footer');

  if (!tabs.length || !table) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const sheetKey = tab.dataset.sheet;
      const data = EXCEL_SHEETS_DATA[sheetKey];
      if (!data) return;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update headers
      const thead = table.querySelector('thead');
      if (thead) {
        thead.innerHTML = `<tr>${data.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
      }

      // Update rows
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
