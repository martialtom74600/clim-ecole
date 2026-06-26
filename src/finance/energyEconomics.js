import { config } from '../config.js';

export const CONSO_MIN_KWH_M2 = 150;
export const CONSO_MAX_KWH_M2 = 350;
export const CONSO_ABERRANT_THRESHOLD = 400;
export const CONSO_FALLBACK_KWH_M2 = 220;

export const MGPE_DUREE_CONTRAT_ANS = 12;
export const MGPE_TAUX_INTERET = 0.04;
export const MGPE_PART_SERVICES_RATE = 0.025;

const DPE_GRADES = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G']);

export function parseDpeGrade(value) {
  const raw = String(value ?? '').trim().toUpperCase();
  if (!raw) return null;
  const letter = raw.charAt(0);
  return DPE_GRADES.has(letter) ? letter : null;
}

export function parseRawConsoFromStatut(statutDpe) {
  const match = String(statutDpe ?? '').match(/\((\d+(?:[.,]\d+)?)\s*kWh/i);
  if (!match) return null;
  const parsed = Number(match[1].replace(',', '.'));
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
}

/** Extrait la conso DPE brute depuis une ligne — jamais depuis Conso_Annuelle/Surface */
export function parseRawDpeConsoFromRow(row) {
  const statut = String(row.Statut_DPE ?? '').trim();
  if (!statut || /^absent$/i.test(statut)) {
    return null;
  }

  const brutMatch = statut.match(/brut\s+(\d+(?:[.,]\d+)?)/i);
  if (brutMatch) {
    const parsed = Number(brutMatch[1].replace(',', '.'));
    return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
  }

  if (/corrigé/i.test(statut)) {
    return null;
  }

  const grade = parseDpeGrade(row.Classe_DPE) ?? parseDpeGrade(statut);
  if (!grade && /estimé/i.test(statut)) {
    return null;
  }

  return parseRawConsoFromStatut(statut);
}

/**
 * Résout la consommation spécifique (kWh/m²/an) avec garde-fous physiques.
 * @param {{ grade?: string|null, rawConsoKwhM2?: number|null }} input
 */
export function resolveConsoSpecifiqueKwhM2({ rawConsoKwhM2 }) {
  if (rawConsoKwhM2 == null || rawConsoKwhM2 <= 0 || rawConsoKwhM2 > CONSO_ABERRANT_THRESHOLD) {
    return CONSO_FALLBACK_KWH_M2;
  }

  return Math.min(CONSO_MAX_KWH_M2, Math.max(CONSO_MIN_KWH_M2, rawConsoKwhM2));
}

export function resolveConsoSpecifiqueFromDpe(dpe) {
  return resolveConsoSpecifiqueKwhM2({
    rawConsoKwhM2: dpe?.consommationM2,
  });
}

export function formatStatutDpeDisplay({ grade, rawConsoKwhM2, usedConsoKwhM2 }) {
  const used = Math.round(usedConsoKwhM2 ?? CONSO_FALLBACK_KWH_M2);
  const label = grade && DPE_GRADES.has(String(grade).toUpperCase().charAt(0))
    ? String(grade).toUpperCase().charAt(0)
    : null;

  if (!label) {
    return `Absent (${used} kWh/m²/an — estimé)`;
  }

  if (rawConsoKwhM2 == null || rawConsoKwhM2 <= 0) {
    return `${label} (${used} kWh/m²/an — estimé)`;
  }

  const raw = Math.round(rawConsoKwhM2);
  if (raw > CONSO_ABERRANT_THRESHOLD || raw !== used) {
    return `${label} (${used} kWh/m²/an — corrigé, brut ${raw})`;
  }

  return `${label} (${used} kWh/m²/an)`;
}

export function computeEnergyEconomics(surfaceM2, consoSpecifiqueKwhM2) {
  const surface = Math.max(0, Number(surfaceM2) || 0);
  const consoM2 = resolveConsoSpecifiqueKwhM2({ rawConsoKwhM2: consoSpecifiqueKwhM2 });
  const prixKwh = config.getPrixKwhTertiaire();
  const consoAnnuelleKwh = Math.round(surface * consoM2);
  const factureAnnuelleEuros = Math.round(consoAnnuelleKwh * prixKwh);
  const economieAnnuelleEuros = Math.round(
    factureAnnuelleEuros * config.cpe.objectifGainCpe,
  );

  return {
    consoSpecifiqueKwhM2: consoM2,
    consoAnnuelleKwh,
    factureAnnuelleEuros,
    economieAnnuelleEuros,
  };
}

export function computeProspectionEnergyEconomics(surfaceM2, dpe) {
  const rawConso = dpe?.consommationM2 ?? null;
  const consoSpecifiqueKwhM2 = resolveConsoSpecifiqueFromDpe(dpe);
  const economics = computeEnergyEconomics(surfaceM2, consoSpecifiqueKwhM2);
  return {
    consoDpeM2: consoSpecifiqueKwhM2,
    statutDpe: formatStatutDpeDisplay({
      grade: dpe?.grade,
      rawConsoKwhM2: rawConso,
      usedConsoKwhM2: consoSpecifiqueKwhM2,
    }),
    ...economics,
  };
}

function parseStoredConsoSpecifique(row) {
  const stored = Number(row.Conso_Specifique_kWh_M2);
  if (Number.isNaN(stored) || stored <= 0 || stored > CONSO_ABERRANT_THRESHOLD) {
    return null;
  }
  return stored;
}

/** Recalcule Conso / Facture / Économie depuis une ligne exportée ou checkpoint */
export function recalculateRowEnergyEconomics(row) {
  const grade = parseDpeGrade(row.Classe_DPE) ?? parseDpeGrade(row.Statut_DPE);
  const rawConso = parseStoredConsoSpecifique(row) ?? parseRawDpeConsoFromRow(row);
  const consoSpecifiqueKwhM2 = resolveConsoSpecifiqueKwhM2({ rawConsoKwhM2: rawConso });
  const economics = computeEnergyEconomics(row.Surface_M2, consoSpecifiqueKwhM2);

  return {
    ...row,
    Conso_Specifique_kWh_M2: consoSpecifiqueKwhM2,
    Conso_Annuelle_kWh: economics.consoAnnuelleKwh,
    Facture_Annuelle_Euros: economics.factureAnnuelleEuros,
    Economie_Annuelle_Euros: economics.economieAnnuelleEuros,
    Statut_DPE: formatStatutDpeDisplay({
      grade,
      rawConsoKwhM2: rawConso,
      usedConsoKwhM2: consoSpecifiqueKwhM2,
    }),
  };
}

/** Amortissement annuel constant (Ft) — reste à charge sur n ans à taux r */
export function computeAnnualAmortization(principal, years = MGPE_DUREE_CONTRAT_ANS, rate = MGPE_TAUX_INTERET) {
  const p = Math.max(0, Number(principal) || 0);
  const n = Math.max(1, Number(years) || MGPE_DUREE_CONTRAT_ANS);
  const r = Math.max(0, Number(rate) || 0);

  if (p === 0) return 0;
  if (r === 0) return p / n;

  const factor = (1 + r) ** n;
  return p * ((r * factor) / (factor - 1));
}

export function simulateMgpePdLoyerFinancials({
  capexTotal,
  partFonds,
  economiesAnnuelles,
  durationYears = MGPE_DUREE_CONTRAT_ANS,
  interestRate = MGPE_TAUX_INTERET,
}) {
  const ftAnnual = computeAnnualAmortization(partFonds, durationYears, interestRate);
  const stAnnual = capexTotal * MGPE_PART_SERVICES_RATE;
  const loyerBase = ftAnnual + stAnnual;

  return {
    dureeContratAns: durationYears,
    tauxInteretPct: Math.round(interestRate * 1000) / 10,
    redevanceFinanciereFt: Math.round(ftAnnual),
    partServicesSt: Math.round(stAnnual),
    loyerSynallagmatiqueEstime: Math.round(loyerBase),
    gainEnergieCiblePct: Math.round(config.cpe.objectifGainCpe * 100),
    economieFinancierePotentielleAn: Math.round(economiesAnnuelles ?? 0),
    ratioLoyerSurEconomie:
      economiesAnnuelles > 0 ? Math.round((loyerBase / economiesAnnuelles) * 100) : null,
  };
}
