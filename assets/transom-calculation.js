// Transom calculation helper (wrapper around SidelightCalculation core logic).
// Uses the same glass_formula metaobject records:
// total = piece * basic_eqn_calc

(function () {
  function debugEnabled() {
    try { return !!window.__GLASS_FORMULA_DEBUG__; } catch (e) { return false; }
  }
  function dlog() {
    if (!debugEnabled()) return;
    try { console.log.apply(console, arguments); } catch (e) {}
  }

  function calculateTransom(params) {
    params = params || {};
    var optionId = params.optionId || 'transom_design';

    dlog('[glass_formula] transom calculate()', { optionId: optionId });

    if (window.SidelightCalculation && typeof window.SidelightCalculation.calculate === 'function') {
      return window.SidelightCalculation.calculate({
        optionId: optionId,
        root: params.root || document,
        glassFormula: params.glassFormula || window.glass_formula || window.glassFormula || []
      });
    }

    return { optionId: String(optionId || ''), selectedLabels: [], lines: [], total: 0 };
  }

  window.TransomCalculation = window.TransomCalculation || {};
  window.TransomCalculation.calculate = calculateTransom;
})();

