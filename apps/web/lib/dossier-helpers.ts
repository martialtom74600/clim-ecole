import type { MarketplaceMgpeSummary } from './types';
import type { ProspectRow } from './types';
import { resteACharge } from './finance-math';

function bestText(values: string[]): string {
  return values.filter((v) => v?.trim()).sort((a, b) => b.length - a.length)[0] ?? '';
}

function avg(nums: number[]): number {
  const valid = nums.filter((n) => Number.isFinite(n) && n > 0);
  if (!valid.length) return 0;
  return valid.reduce((s, n) => s + n, 0) / valid.length;
}

export function buildMgpeSummary(batiments: ProspectRow[]): MarketplaceMgpeSummary | undefined {
  const withSignal = batiments.filter(
    (b) =>
      b.argumentaireMgpePd?.trim() ||
      b.argumentaireLoiElan?.trim() ||
      b.mgpeDureeContratAns > 0,
  );
  if (!withSignal.length) return undefined;

  return {
    loyerLtEuros: avg(batiments.map((b) => b.mgpeLoyerLtEuros)),
    redevanceFtEuros: avg(batiments.map((b) => b.mgpeRedevanceFtEuros)),
    partServicesEuros: avg(batiments.map((b) => b.mgpePartServicesStEuros)),
    dureeContratAns: Math.round(avg(batiments.map((b) => b.mgpeDureeContratAns))),
    gainNetContractuelEuros: batiments.reduce((s, b) => s + (b.gainNetContractuelEuros || 0), 0),
    argumentaireLoiElan: bestText(batiments.map((b) => b.argumentaireLoiElan)),
    argumentaireMgpePd: bestText(batiments.map((b) => b.argumentaireMgpePd)),
  };
}

export function resteAChargeAfterSubs(capex: number, subventions: number): number {
  return resteACharge(capex, subventions);
}
