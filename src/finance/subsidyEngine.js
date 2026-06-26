import { config } from '../config.js';

/** Plafond L. 1111-10 CGCT — subventions publiques ≤ 80 % du CAPEX HT */
export const MAX_PUBLIC_SUBSIDY_HT_RATE = 0.8;

export const SUBSIDY_STACKING_REALISTE = 'realiste';
export const SUBSIDY_STACKING_OPTIMISTE = 'optimiste';

function isOptimisteStacking() {
  return config.finance.subsidyStacking === SUBSIDY_STACKING_OPTIMISTE;
}

export function getDetrSubsidyRate(population) {
  const pop = Number(population);
  if (Number.isNaN(pop)) {
    return config.finance.subsidyRateLarge;
  }
  if (pop < config.finance.subsidyThresholdSmall) {
    return config.finance.subsidyRateSmall;
  }
  if (pop <= config.finance.subsidyThresholdMedium) {
    return config.finance.subsidyRateMedium;
  }
  return config.finance.subsidyRateLarge;
}

/** Taux indicatif Fonds Vert ÉduRénov (gain énergétique ≥ 40 % visé) */
export function getFondsVertEdurenovRate() {
  return 0.4;
}

/** Taux indicatif DSIL (département) selon taille communale */
export function getDsilRate(population) {
  const pop = Number(population);
  if (Number.isNaN(pop)) return 0.15;
  if (pop < config.finance.subsidyThresholdSmall) return 0.3;
  if (pop <= config.finance.subsidyThresholdMedium) return 0.2;
  return 0.1;
}

export function capexHtFromTtc(capexTotalTtc) {
  const tva = config.cpe.tvaCollectivites ?? 0.2;
  return capexTotalTtc / (1 + tva);
}

/**
 * Scénario optimiste (legacy) : DETR + Fonds Vert + DSIL sur TTC, plafond 80 % HT.
 */
function computeOptimisteSubventions(capexTotalTtc, population) {
  const capex = Math.max(0, Number(capexTotalTtc) || 0);
  const capexHt = capexHtFromTtc(capex);
  const capEuros = Math.round(capexHt * MAX_PUBLIC_SUBSIDY_HT_RATE);

  const detr = Math.round(capex * getDetrSubsidyRate(population));
  const fondsVert = Math.round(capex * getFondsVertEdurenovRate());
  const dsil = Math.round(capex * getDsilRate(population));

  const rawTotal = detr + fondsVert + dsil;
  const subventionsEtat = Math.min(rawTotal, capEuros);

  return {
    Subventions_Etat_Euros: subventionsEtat,
    Subventions_Detr_Euros: detr,
    Subventions_Fonds_Vert_Euros: fondsVert,
    Subventions_Dsil_Euros: dsil,
    Subventions_Plafond_80pct_Applique: rawTotal > capEuros,
    CAPEX_HT_Euros: Math.round(capexHt),
    Modele_Financement: SUBSIDY_STACKING_OPTIMISTE,
    _subventionCapEuros: capEuros,
    _subventionRawTotal: rawTotal,
    _subventionTerritorialEuros: detr + dsil,
  };
}

/**
 * Scénario réaliste (défaut) :
 * - Taux appliqués sur CAPEX HT (base instruction DETR / Fonds Vert)
 * - DETR et DSIL non cumulés intégralement : retenir le plus favorable (enveloppe territoriale)
 * - Fonds Vert au taux « accordé » (pas le plafond réglementaire 40 %)
 * - Plafond 80 % HT CGCT L. 1111-10
 */
function computeRealisteSubventions(capexTotalTtc, population) {
  const capex = Math.max(0, Number(capexTotalTtc) || 0);
  const capexHt = capexHtFromTtc(capex);
  const capEuros = Math.round(capexHt * MAX_PUBLIC_SUBSIDY_HT_RATE);

  const detrHt = Math.round(capexHt * getDetrSubsidyRate(population));
  const dsilHt = Math.round(capexHt * getDsilRate(population));
  const territorialHt = Math.max(detrHt, dsilHt);

  const fondsVertRate =
    config.finance.fondsVertRealisticRate ?? getFondsVertEdurenovRate() * 0.75;
  const fondsVertHt = Math.round(capexHt * fondsVertRate);

  const rawTotal = territorialHt + fondsVertHt;
  const subventionsEtat = Math.min(rawTotal, capEuros);

  const territorialIsDetr = detrHt >= dsilHt;

  return {
    Subventions_Etat_Euros: subventionsEtat,
    Subventions_Detr_Euros: territorialIsDetr ? territorialHt : 0,
    Subventions_Fonds_Vert_Euros: fondsVertHt,
    Subventions_Dsil_Euros: territorialIsDetr ? 0 : territorialHt,
    Subventions_Plafond_80pct_Applique: rawTotal > capEuros,
    CAPEX_HT_Euros: Math.round(capexHt),
    Modele_Financement: SUBSIDY_STACKING_REALISTE,
    _subventionCapEuros: capEuros,
    _subventionRawTotal: rawTotal,
    _subventionTerritorialEuros: territorialHt,
  };
}

/**
 * Subventions publiques — modèle piloté par SUBSIDY_STACKING (realiste par défaut).
 */
export function computeMultiBailleurSubventions(capexTotalTtc, population) {
  if (isOptimisteStacking()) {
    return computeOptimisteSubventions(capexTotalTtc, population);
  }
  return computeRealisteSubventions(capexTotalTtc, population);
}

/** @deprecated Alias — utiliser computeMultiBailleurSubventions */
export function computeSubventionsEtat(capexTotal, population) {
  return computeMultiBailleurSubventions(capexTotal, population).Subventions_Etat_Euros;
}

/** @deprecated Utiliser computeCeeFromTechnicalProfile — alias forfait */
export function computeCeeTertiaire(surfaceM2) {
  const { ceeConsoReferenceKwhM2, ceeKwhCumacValorisation } = config.finance;
  return Math.round(surfaceM2 * ceeConsoReferenceKwhM2 * ceeKwhCumacValorisation);
}

export function computeFinancingAlert(capexTotal, subventionsEtat, ceeEuros) {
  const reste = capexTotal - subventionsEtat - ceeEuros;
  if (reste < 0) {
    return 'Surfinancement public : CAPEX − Subventions − CEE < 0 (plafond 80 % HT CGCT L. 1111-10)';
  }
  return null;
}
