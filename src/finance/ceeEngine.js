import { config } from '../config.js';
import { computeTechnicalProfile } from '../industrial/technicalEngine.js';

/**
 * kWh cumac indicatifs au m² (fiches BAT — ordre de grandeur marché tertiaire / écoles).
 * Sources : BAT-TH-113/163 (PAC), BAT-EN-101 (combles), BAT-EN-103 (plancher bas) — non audit PNCEE.
 */
const CUMAC_KWH_M2_BY_SCENARIO = {
  LOURDE: { pac: 52, isolation: 48, gtb: 8 },
  MOYENNE: { pac: 38, isolation: 22, gtb: 6 },
};

function resolveScenarioKey(anneeConstruction) {
  const year = Number(anneeConstruction);
  if (!Number.isFinite(year) || year <= 0) return 'MOYENNE';
  return year < 1975 ? 'LOURDE' : 'MOYENNE';
}

/**
 * CEE estimés à partir du profil travaux (plus proche d'un dossier RGE qu'un forfait surface×140).
 */
export function computeCeeFromTechnicalProfile(surfaceM2, anneeConstruction) {
  const surface = Math.max(0, Number(surfaceM2) || 0);
  const scenario = resolveScenarioKey(anneeConstruction);
  const coeffs = CUMAC_KWH_M2_BY_SCENARIO[scenario];
  const cumacKwh = surface * (coeffs.pac + coeffs.isolation + coeffs.gtb);
  const { ceeKwhCumacValorisation, ceeMaxShareOfCapexHt } = config.finance;

  let ceeEuros = Math.round(cumacKwh * ceeKwhCumacValorisation);

  const tech = computeTechnicalProfile(surface, anneeConstruction);
  const capexHt = tech.capexTechniqueEur / (1 + (config.cpe.tvaCollectivites ?? 0.2));
  const capCee = Math.round(capexHt * ceeMaxShareOfCapexHt);
  if (ceeEuros > capCee) {
    ceeEuros = capCee;
  }

  return {
    CEE_Euros: ceeEuros,
    _ceeCumacKwh: Math.round(cumacKwh),
    _ceeScenario: scenario,
    _ceeMethode: 'fiches_travaux',
  };
}

/** @deprecated Forfait surface — conservé si SUBSIDY_STACKING=optimiste côté legacy CEE */
export function computeCeeTertiaireForfait(surfaceM2) {
  const { ceeConsoReferenceKwhM2, ceeKwhCumacValorisation } = config.finance;
  return Math.round(surfaceM2 * ceeConsoReferenceKwhM2 * ceeKwhCumacValorisation);
}
