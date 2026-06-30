/** Calculs financiers synchronisés (curseurs → KPIs en temps réel) */

import { resteACharge, subventionsFromRatio } from './finance-math';

export interface FinanceSimInput {
  capex: number;
  baseSubventionRatio: number;
  subRatePct: number;
  baseGainNetMairie: number;
  baseRoiAnnees: number;
  mgpe?: {
    loyerLtEuros: number;
    redevanceFtEuros: number;
    gainNetContractuelEuros: number;
    dureeContratAns: number;
  };
  loyerFactor: number;
  dureeAns: number;
}

export interface FinanceSimResult {
  subventions: number;
  subventionRatio: number;
  rac: number;
  loyer: number;
  redevance: number;
  gainNet: number;
  roiAnnees: number;
  gainContractuel: number;
  racPess: number;
  racOpt: number;
  subventionsPess: number;
  subventionsOpt: number;
}

function racFromRate(capex: number, ratePct: number): { subventions: number; rac: number; ratio: number } {
  const ratio = ratePct / 100;
  const subventions = subventionsFromRatio(capex, ratio);
  return { subventions, rac: resteACharge(capex, subventions), ratio };
}

export function computeFinanceSimulation(input: FinanceSimInput): FinanceSimResult {
  const { subventions, rac, ratio } = racFromRate(input.capex, input.subRatePct);

  const baseRac = Math.max(1, input.capex * (1 - input.baseSubventionRatio));
  const racScale = rac / baseRac;

  const baseLoyer = input.mgpe?.loyerLtEuros ?? 0;
  const loyer = baseLoyer * racScale * input.loyerFactor;
  const redevance = input.mgpe?.redevanceFtEuros ?? 0;

  // Les économies d'énergie sont stables ; le gain net monte quand le loyer baisse (plus d'aides)
  const gainNet = Math.max(0, input.baseGainNetMairie + (baseLoyer - loyer));
  const roiAnnees = gainNet > 0 ? rac / gainNet : input.baseRoiAnnees;

  const dureeBase = Math.max(1, input.mgpe?.dureeContratAns || 15);
  const gainContractuel =
    (input.mgpe?.gainNetContractuelEuros ?? gainNet) *
    (input.dureeAns / dureeBase) *
    racScale *
    input.loyerFactor;

  const pess = racFromRate(input.capex, Math.max(10, input.subRatePct - 12));
  const opt = racFromRate(input.capex, Math.min(70, input.subRatePct + 10));

  return {
    subventions,
    subventionRatio: ratio,
    rac,
    loyer,
    redevance,
    gainNet,
    roiAnnees,
    gainContractuel,
    racPess: pess.rac,
    racOpt: opt.rac,
    subventionsPess: pess.subventions,
    subventionsOpt: opt.subventions,
  };
}
