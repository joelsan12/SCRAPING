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

  const ANNUAL_SERVICE_COST = 200 + (12 * 80); // $200 setup + 12 * $80 = $1,160 USD

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

    // Dynamically update WhatsApp CTA message
    if (calcCtaBtn) {
      const waText = encodeURIComponent(
        `Hola LicitaciónYa, calculé en su web un retorno estimado de ${formatCurrency(totalProfit)} con ${contracts} contrato(s). Quisiera activar mi prueba gratis de 15 días para mi empresa.`
      );
      calcCtaBtn.href = `https://wa.me/593979116551?text=${waText}`;
    }
  }

  marginSlider.addEventListener('input', updateCalculations);
  contractsSlider.addEventListener('input', updateCalculations);

  // Initial calculation on load
  updateCalculations();
}
