/**
 * LicitaciónYa — Calculadora de retorno
 * Estimación referencial con formato es-EC.
 */

export function initCalculator() {
  const marginSlider = document.getElementById('calc-margin-slider');
  const contractsSlider = document.getElementById('calc-contracts-slider');

  if (!marginSlider || !contractsSlider) return;

  const marginBadge = document.getElementById('calc-margin-badge');
  const contractsBadge = document.getElementById('calc-contracts-badge');
  const resultProfit = document.getElementById('calc-result-profit');
  const resultCost = document.getElementById('calc-result-cost');
  const resultRoi = document.getElementById('calc-result-roi');

  const ANNUAL_SERVICE_COST = 12 * 80;

  const numberFormatter = new Intl.NumberFormat('es-EC', {
    maximumFractionDigits: 0
  });

  function formatUsd(amount) {
    return `USD ${numberFormatter.format(amount)}`;
  }

  function update() {
    const margin = Number(marginSlider.value) || 15000;
    const contracts = Number(contractsSlider.value) || 1;
    const totalProfit = margin * contracts;
    const netBenefit = totalProfit - ANNUAL_SERVICE_COST;
    const roi = Math.round((netBenefit / ANNUAL_SERVICE_COST) * 100);

    if (marginBadge) marginBadge.textContent = formatUsd(margin);
    if (contractsBadge) {
      contractsBadge.textContent = `${contracts} contrato${contracts === 1 ? '' : 's'}`;
    }

    if (resultProfit) resultProfit.textContent = formatUsd(totalProfit);
    if (resultCost) resultCost.textContent = formatUsd(ANNUAL_SERVICE_COST);
    if (resultRoi) resultRoi.textContent = `${roi >= 0 ? '+' : ''}${numberFormatter.format(roi)}%`;

    marginSlider.setAttribute('aria-valuetext', formatUsd(margin));
    contractsSlider.setAttribute('aria-valuetext', `${contracts} contrato${contracts === 1 ? '' : 's'}`);
  }

  marginSlider.addEventListener('input', update);
  contractsSlider.addEventListener('input', update);

  update();
}
