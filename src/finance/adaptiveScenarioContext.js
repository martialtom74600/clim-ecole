import { config } from '../config.js';
import { parseDpeGrade } from './energyEconomics.js';

/** Je résous les seuils adaptatifs depuis la config (surchargeables par .env). */
function adaptiveConfig() {
  const a = config.finance.adaptive ?? {};
  return {
    ruralPopulationThreshold: a.ruralPopulationThreshold ?? 3500,
    subsidyPessimisteRuralRate: a.subsidyPessimisteRuralRate ?? 0.65,
    subsidyPessimisteUrbainRate: a.subsidyPessimisteUrbainRate ?? 0.45,
    subsidyPessimisteDpeFgBonus: a.subsidyPessimisteDpeFgBonus ?? 0.05,
    ecoPessimisteLourdeRate: a.ecoPessimisteLourdeRate ?? 0.7,
    ecoPessimisteMoyenneLegereRate: a.ecoPessimisteMoyenneLegereRate ?? 0.55,
    pacSurdimensionnementSeuilWM2: a.pacSurdimensionnementSeuilWM2 ?? 60,
  };
}

/** Je déduis la classe DPE depuis Classe_DPE ou Statut_DPE. */
export function resolveDpeGradeFromRow({ classeDpe, statutDpe }) {
  return parseDpeGrade(classeDpe) ?? parseDpeGrade(statutDpe);
}

/**
 * Je calcule le taux de subvention pessimiste (base TTC) selon la vulnérabilité communale :
 * - < 3 500 hab. → 65 % (DETR sécurisée)
 * - ≥ 3 500 hab. → 45 % (concurrence Fonds Vert)
 * - DPE F/G → +5 % (priorité ÉduRénov)
 */
export function computeAdaptivePessimisticSubsidyRate({ population, classeDpe, statutDpe }) {
  const cfg = adaptiveConfig();
  const pop = Number(population);

  let rate =
    Number.isFinite(pop) && pop > 0 && pop < cfg.ruralPopulationThreshold
      ? cfg.subsidyPessimisteRuralRate
      : cfg.subsidyPessimisteUrbainRate;

  const grade = resolveDpeGradeFromRow({ classeDpe, statutDpe });
  if (grade === 'F' || grade === 'G') {
    rate += cfg.subsidyPessimisteDpeFgBonus;
  }

  return Math.min(rate, 1);
}

/**
 * Je calibre le coefficient d'économie réaliste pessimiste selon l'ambition du lot travaux :
 * - Rénovation Lourde (ITE + menuiseries) → 0,70
 * - Rénovation Moyenne / Légère → 0,55
 */
export function computeAdaptivePessimisticEcoRate({ typeTravaux }) {
  const cfg = adaptiveConfig();
  const label = String(typeTravaux ?? '').trim();
  if (label === 'Rénovation Lourde') {
    return cfg.ecoPessimisteLourdeRate;
  }
  return cfg.ecoPessimisteMoyenneLegereRate;
}

/** Je construis le profil pessimiste contextualisé pour une école. */
export function buildAdaptivePessimisticProfile(baseProfile, context) {
  const subsidyRate = computeAdaptivePessimisticSubsidyRate(context);
  const economieRealisationRate = computeAdaptivePessimisticEcoRate(context);

  return {
    ...baseProfile,
    subsidyRate,
    economieRealisationRate,
    _adaptiveMeta: {
      population: context.population ?? null,
      dpeGrade: resolveDpeGradeFromRow(context),
      typeTravaux: context.typeTravaux ?? null,
      subsidyRatePct: Math.round(subsidyRate * 1000) / 10,
      economieRealisationRatePct: Math.round(economieRealisationRate * 1000) / 10,
    },
  };
}

/**
 * Je contrôle le dimensionnement PAC après rénovation lourde (ITE).
 * Ratio_W_M2 = (Puissance_PAC_kW × 1000) / Surface_m²
 */
export function computePacSurdimensionnementAlert({ typeTravaux, puissancePacKw, surfaceM2 }) {
  const cfg = adaptiveConfig();
  const surface = Math.max(0, Number(surfaceM2) || 0);
  const pacKw = Math.max(0, Number(puissancePacKw) || 0);
  const label = String(typeTravaux ?? '').trim();

  if (surface <= 0 || pacKw <= 0) {
    return {
      Alerte_Surdimensionnement: false,
      Alerte_Surdimensionnement_Note: null,
      Ratio_PAC_W_M2: null,
    };
  }

  const ratioWM2 = Math.round(((pacKw * 1000) / surface) * 10) / 10;

  if (label === 'Rénovation Lourde' && ratioWM2 > cfg.pacSurdimensionnementSeuilWM2) {
    return {
      Alerte_Surdimensionnement: true,
      Alerte_Surdimensionnement_Note:
        `PAC surdimensionnée pour bâtiment isolé (ITE) : ${ratioWM2} W/m² > ${cfg.pacSurdimensionnementSeuilWM2} W/m² — revoir la note de dimensionnement CVC et le débit nominal`,
      Ratio_PAC_W_M2: ratioWM2,
    };
  }

  return {
    Alerte_Surdimensionnement: false,
    Alerte_Surdimensionnement_Note: null,
    Ratio_PAC_W_M2: ratioWM2,
  };
}

/** Je normalise le contexte adaptatif depuis une ligne école enrichie. */
export function buildAdaptiveContextFromRow(row, population) {
  return {
    population: population ?? null,
    classeDpe: row.Classe_DPE,
    statutDpe: row.Statut_DPE,
    typeTravaux: row.Type_Travaux,
    codeInsee: row.Code_INSEE,
  };
}
