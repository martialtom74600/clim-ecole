import { config } from '../config.js';
import { capexHtFromTtc, computeFinancingAlert } from './subsidyEngine.js';
import { computeCeeFromTechnicalProfile, computeCeeTertiaireForfait } from './ceeEngine.js';
import { computeTechnicalProfile } from '../industrial/technicalEngine.js';

export function estimateCapexTotal(surfaceM2, capexOverride, anneeConstruction) {
  if (capexOverride != null && capexOverride > 0) {
    return Math.round(capexOverride);
  }
  return computeTechnicalProfile(surfaceM2, anneeConstruction).capexTechniqueEur;
}

/** ROI fonds = Part_Fonds / gain net mairie (économie − loyer Lt) */
export function computeFondsRoiYears(partFonds, gainNetAnnuelMairieEuros) {
  if (!gainNetAnnuelMairieEuros || gainNetAnnuelMairieEuros <= 0) {
    return null;
  }
  return Math.round((partFonds / gainNetAnnuelMairieEuros) * 10) / 10;
}

export function assignFinancingStatus(partFonds, fondsRoiYears, gainNetAnnuelMairieEuros) {
  if (!gainNetAnnuelMairieEuros || gainNetAnnuelMairieEuros <= 0) {
    return 'À_REGROUPER';
  }

  if (
    fondsRoiYears != null &&
    fondsRoiYears <= config.finance.maxFondsRoiYearsSolo &&
    partFonds >= config.finance.minPartFondsSolo
  ) {
    return 'FINANÇABLE_SOLO';
  }

  return 'À_REGROUPER';
}

function resolveCeeEuros(surfaceM2, anneeConstruction) {
  if (config.finance.subsidyStacking === 'optimiste') {
    return {
      CEE_Euros: computeCeeTertiaireForfait(surfaceM2),
      _ceeMethode: 'forfait_surface',
    };
  }
  return computeCeeFromTechnicalProfile(surfaceM2, anneeConstruction);
}

/** Je calcule le CAPEX technique et les CEE — les subventions passent par scenarioEngine. */
export function computeSchoolFinanceBase({ surfaceM2, capexTechniqueEur, anneeConstruction }) {
  const capexTotal = estimateCapexTotal(surfaceM2, capexTechniqueEur, anneeConstruction);
  const cee = resolveCeeEuros(surfaceM2, anneeConstruction);
  const ceeEuros = cee.CEE_Euros;

  return {
    CAPEX_HT_Euros: Math.round(capexHtFromTtc(capexTotal)),
    Modele_Financement: 'fourchette',
    CEE_Euros: ceeEuros,
    _capexTotal: capexTotal,
    _ceeCumacKwh: cee._ceeCumacKwh,
    _ceeMethode: cee._ceeMethode,
    _ceeScenario: cee._ceeScenario,
  };
}

/** @deprecated Alias — préférer computeSchoolFinanceBase + computeDualScenarioFinances */
export function computeSchoolFinancials(params) {
  return computeSchoolFinanceBase(params);
}

export { computeFinancingAlert };
