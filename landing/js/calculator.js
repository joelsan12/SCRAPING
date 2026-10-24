/**
 * LicitaciónYa — Interactive B2B ROI Calculator Module
 */

export function initCalculator() {
  const marginSlider = document.getElementById('calc-margin-slider');
  const contractsSlider = document.getElementById('calc-contracts-slider');

  const marginBadge = document.getElementById('calc-margin-badge');
  const contractsBadge = document.getElementById('calc-contracts-badge');

  const resultProfit = document.getElementById('calc-result-profit');
  const resultCost = document.getElementById('calc-result-cost');
  const resultRoi = document.getElementById('calc-result-roi');
  const calcCtaBtn = document.getElementById('calc-cta-btn');

  if (!marginSlider || !contractsSlider) return;

  const ANNUAL_SERVICE_COST = 12 * 80; // 12 * $80 = $960 USD (sin costo de setup)

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  }

  function updateCalculations() {
    const margin = parseInt(marginSlider.value, 10) || 15000;
    const contracts = parseInt(contractsSlider.value, 10) || 2;

    const totalProfit = margin * contracts;
    const netBenefit = totalProfit - ANNUAL_SERVICE_COST;
    const roiMultiplier = Math.round((netBenefit / ANNUAL_SERVICE_COST) * 100);

    // Update Badges
    if (marginBadge) marginBadge.textContent = formatCurrency(margin);
    if (contractsBadge) contractsBadge.textContent = `${contracts} contrato${contracts > 1 ? 's' : ''}`;

    // Update Output
    if (resultProfit) resultProfit.textContent = formatCurrency(totalProfit);
    if (resultCost) resultCost.textContent = formatCurrency(ANNUAL_SERVICE_COST);
    if (resultRoi) resultRoi.textContent = `+${roiMultiplier.toLocaleString()}%`;

    // Action button opens the onboarding modal
    if (calcCtaBtn) {
      calcCtaBtn.classList.add('btn-open-trial');
    }
  }

  marginSlider.addEventListener('input', updateCalculations);
  contractsSlider.addEventListener('input', updateCalculations);

  // Initial calculation on load
  updateCalculations();
}
