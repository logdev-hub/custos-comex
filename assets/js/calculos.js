/* Motor puro: não contém tarifas. Valores monetários mantêm precisão; arredondamento só na UI. */
(function (g) {
  'use strict';
  const n = (v, d = 0) => { const x = Number(v); return Number.isFinite(x) ? x : d; };
  const nonNegative = v => Math.max(0, n(v));
  function pesoVolumetrico(comprimento, largura, altura, quantidade = 1, divisor = 6000) {
    return divisor > 0 ? nonNegative(comprimento) * nonNegative(largura) * nonNegative(altura) * nonNegative(quantidade) / divisor : 0;
  }
  function pesoTarifavel(real, volumetrico) { return Math.max(nonNegative(real), nonNegative(volumetrico)); }
  function wm(pesoKg, volumeM3) { return Math.max(nonNegative(pesoKg) / 1000, nonNegative(volumeM3)); }
  function freteLCL(rt, tarifa, minimo) { return Math.max(nonNegative(rt) * nonNegative(tarifa), nonNegative(minimo)); }
  function armazenagemPeriodo(cifBrl, percentual, minimo, bls = 1) { return Math.max(nonNegative(cifBrl) * nonNegative(percentual), nonNegative(minimo) * Math.max(1, nonNegative(bls))); }
  function progressiva(diasExcedentes, faixas) {
    let dias = Math.floor(nonNegative(diasExcedentes)), total = 0, usados = 0;
    for (const f of faixas || []) { const limite = f.ate == null ? Infinity : nonNegative(f.ate); const qtd = Math.max(0, Math.min(dias, limite) - usados); total += qtd * nonNegative(f.valor); usados += qtd; if (usados >= dias) break; }
    return total;
  }
  function afrmm(base, aliquota, aplicavel = true) { return aplicavel ? nonNegative(base) * nonNegative(aliquota) : 0; }
  function tributos(va, a, afrmmValor = 0, despesasIcms = 0) {
    va = nonNegative(va); const ii = va * nonNegative(a.ii); const ipi = (va + ii) * nonNegative(a.ipi);
    const pis = va * nonNegative(a.pis); const cofins = va * (nonNegative(a.cofins) + nonNegative(a.cofinsAdicional));
    const preliminar = va + ii + ipi + pis + cofins + nonNegative(afrmmValor) + nonNegative(despesasIcms);
    const tx = Math.min(0.999999, nonNegative(a.icms)); const baseIcms = preliminar / (1 - tx); const icms = baseIcms * tx;
    return { ii, ipi, pis, cofins, preliminar, baseIcms, icms, total: ii + ipi + pis + cofins + icms };
  }
  function seguro(base, cobertura, taxa, minimo) { const segurado = nonNegative(base) * nonNegative(cobertura); return { segurado, premio: Math.max(segurado * nonNegative(taxa), nonNegative(minimo)) }; }
  function custoCapital(valor, taxaMensal, dias) { return nonNegative(valor) * nonNegative(taxaMensal) * nonNegative(dias) / 30; }
  function pisoRodoviario(ccd, distancia, cc) { return nonNegative(ccd) * nonNegative(distancia) + nonNegative(cc); }
  function breakEven(cfg) { let melhor = null; const passos = Math.floor(nonNegative(cfg.max || 80) * 10); for (let i = 1; i <= passos; i++) { const v = i / 10; const lcl = nonNegative(cfg.fixoLcl) + Math.max(v, nonNegative(cfg.tonPeso)) * nonNegative(cfg.tarifaLcl) + nonNegative(cfg.destinoLcl); const fcl = nonNegative(cfg.freteFcl) + nonNegative(cfg.fixoFcl) + nonNegative(cfg.destinoFcl); if (lcl >= fcl) { melhor = { volume: v, lcl, fcl }; break; } } return melhor; }
  function totalLandedCost(partes) { return Object.values(partes || {}).reduce((s, v) => s + nonNegative(v), 0); }
  g.Calculos = { n, nonNegative, pesoVolumetrico, pesoTarifavel, wm, freteLCL, armazenagemPeriodo, progressiva, afrmm, tributos, seguro, custoCapital, pisoRodoviario, breakEven, totalLandedCost };
})(window);
