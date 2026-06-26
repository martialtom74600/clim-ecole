import { config } from '../config.js';

/** Économie annuelle « réaliste » (écart mesure / météo / usages) — base décision mairie / fonds */
export function computeRealisticAnnualSavings(contractualEconomieEuros) {
  const contract = Math.max(0, Number(contractualEconomieEuros) || 0);
  const rate = config.finance.cpeRealisationRate ?? 0.75;
  return Math.round(contract * rate);
}

/** Plancher IPMVP 66 % — pire cas sous-performance sur l'économie contractuelle */
export function computePerformanceFloorSavings(contractualEconomieEuros) {
  const contract = Math.max(0, Number(contractualEconomieEuros) || 0);
  const floor = config.finance.mgpePerformanceFloor ?? 0.66;
  return Math.round(contract * floor);
}
