/**
 * Moteur de tri algorithmique — Radar de prospection
 * Taggage multi-personas par deal (BTP · BE · AMO · ESCO · CEE)
 */

import type { ClientPersona } from './brand';

export const PERSONA_THRESHOLDS = {
  BTP_CAPEX_MIN: 400_000,
  AMO_SUBVENTION_RATIO_MIN: 0.5,
  BE_SURFACE_MAX_M2: 2_500,
  BE_PASSOIRE_MAJORITY: 0.4,
  /** ESCO — volume mutualisable */
  ESCO_BATIMENT_MIN: 5,
  ESCO_CAPEX_MIN: 800_000,
  /** CEE — cumac significatif */
  CEE_EUROS_MIN: 15_000,
  CEE_PASSOIRE_MIN: 0.4,
} as const;

const PASSOIRE_DPE = new Set(['F', 'G']);

export interface DealPersonaInput {
  packCapexTotal: number;
  subventionsTotal: number;
  statutProjetEpci: string;
  batimentCount?: number;
  ceeEurosTotal?: number;
  batiments: {
    classeDpe: string;
    surfaceM2: number;
  }[];
}

export interface DealPersonaResult {
  personas: ClientPersona[];
  primaryPersona: ClientPersona;
  subventionRatio: number;
  passoireRatio: number;
  avgSurfaceM2: number;
  isMutualizable: boolean;
}

function isPassoireDpe(classe: string): boolean {
  return PASSOIRE_DPE.has(classe.trim().toUpperCase());
}

export function inferDealPersona(deal: DealPersonaInput): DealPersonaResult {
  const { packCapexTotal, subventionsTotal, statutProjetEpci, batiments } = deal;
  const personas: ClientPersona[] = [];
  const batimentCount = deal.batimentCount ?? batiments.length;

  const subventionRatio =
    packCapexTotal > 0 ? subventionsTotal / packCapexTotal : 0;

  const passoireCount = batiments.filter((b) => isPassoireDpe(b.classeDpe)).length;
  const passoireRatio =
    batiments.length > 0 ? passoireCount / batiments.length : 0;

  const avgSurfaceM2 =
    batiments.length > 0
      ? batiments.reduce((s, b) => s + b.surfaceM2, 0) / batiments.length
      : 0;

  const isMutualizable =
    batimentCount >= PERSONA_THRESHOLDS.ESCO_BATIMENT_MIN &&
    packCapexTotal >= PERSONA_THRESHOLDS.ESCO_CAPEX_MIN;

  if (packCapexTotal > PERSONA_THRESHOLDS.BTP_CAPEX_MIN) {
    personas.push('btp');
  }

  if (
    passoireRatio > PERSONA_THRESHOLDS.BE_PASSOIRE_MAJORITY &&
    avgSurfaceM2 < PERSONA_THRESHOLDS.BE_SURFACE_MAX_M2
  ) {
    personas.push('be');
  }

  if (
    subventionRatio >= PERSONA_THRESHOLDS.AMO_SUBVENTION_RATIO_MIN ||
    statutProjetEpci === 'PROJET_GLOBAL_VALIDE'
  ) {
    personas.push('amo');
  }

  if (isMutualizable) {
    personas.push('esco');
  }

  const ceeTotal = deal.ceeEurosTotal ?? 0;
  if (
    ceeTotal >= PERSONA_THRESHOLDS.CEE_EUROS_MIN ||
    (passoireRatio >= PERSONA_THRESHOLDS.CEE_PASSOIRE_MIN && batimentCount >= 3)
  ) {
    personas.push('cee');
  }

  if (personas.length === 0) {
    personas.push('amo');
  }

  const primaryPersona = inferPrimaryPersona(personas, {
    packCapexTotal,
    subventionRatio,
    statutProjetEpci,
    isMutualizable,
    ceeEurosTotal: ceeTotal,
  });

  return {
    personas,
    primaryPersona,
    subventionRatio,
    passoireRatio,
    avgSurfaceM2,
    isMutualizable,
  };
}

export function inferPrimaryPersona(
  personas: ClientPersona[],
  ctx: {
    packCapexTotal: number;
    subventionRatio: number;
    statutProjetEpci: string;
    isMutualizable?: boolean;
    ceeEurosTotal?: number;
  },
): ClientPersona {
  if (ctx.isMutualizable && personas.includes('esco')) return 'esco';
  if (
    (ctx.ceeEurosTotal ?? 0) >= PERSONA_THRESHOLDS.CEE_EUROS_MIN &&
    personas.includes('cee')
  ) {
    return 'cee';
  }
  if (
    ctx.statutProjetEpci === 'PROJET_GLOBAL_VALIDE' &&
    personas.includes('amo')
  ) {
    return 'amo';
  }
  if (personas.includes('amo') && ctx.subventionRatio >= 0.5) return 'amo';
  if (personas.includes('btp') && ctx.packCapexTotal >= 1_000_000) return 'btp';
  if (personas.includes('btp')) return 'btp';
  if (personas.includes('amo')) return 'amo';
  if (personas.includes('be')) return 'be';
  if (personas.includes('esco')) return 'esco';
  if (personas.includes('cee')) return 'cee';
  return personas[0] ?? 'amo';
}

export function packMatchesPersonaFilter(
  personas: ClientPersona[],
  filter: ClientPersona | 'all',
): boolean {
  if (filter === 'all') return true;
  return personas.includes(filter);
}

export interface PersonaExplanation {
  persona: ClientPersona;
  reasons: string[];
}

export function explainDealPersona(deal: DealPersonaInput): PersonaExplanation[] {
  const result = inferDealPersona(deal);
  const explanations: PersonaExplanation[] = [];

  if (result.personas.includes('btp')) {
    explanations.push({
      persona: 'btp',
      reasons: [
        `CAPEX estimé ${Math.round(deal.packCapexTotal / 1000)} k€ (> ${PERSONA_THRESHOLDS.BTP_CAPEX_MIN / 1000} k€)`,
        'Profil Volume & Travaux — pack prêt à chiffrer',
      ],
    });
  }

  if (result.personas.includes('be')) {
    explanations.push({
      persona: 'be',
      reasons: [
        `${Math.round(result.passoireRatio * 100)} % de bâtiments DPE F/G`,
        `Surface moyenne ${Math.round(result.avgSurfaceM2)} m²`,
        'Profil Ingénierie & Audit',
      ],
    });
  }

  if (result.personas.includes('amo')) {
    const reasons = [
      `Ratio subventions/CAPEX ${Math.round(result.subventionRatio * 100)} %`,
    ];
    if (deal.statutProjetEpci === 'PROJET_GLOBAL_VALIDE') {
      reasons.push('Projet global EPCI validé');
    }
    reasons.push('Profil Montage Financier — dossier MGPE-PD');
    explanations.push({ persona: 'amo', reasons });
  }

  if (result.personas.includes('esco')) {
    explanations.push({
      persona: 'esco',
      reasons: [
        `${deal.batimentCount ?? deal.batiments.length} écoles — mutualisation CPE viable`,
        `CAPEX ${Math.round(deal.packCapexTotal / 1000)} k€ (> ${PERSONA_THRESHOLDS.ESCO_CAPEX_MIN / 1000} k€)`,
      ],
    });
  }

  if (result.personas.includes('cee')) {
    explanations.push({
      persona: 'cee',
      reasons: [
        deal.ceeEurosTotal
          ? `CEE estimés ${Math.round((deal.ceeEurosTotal ?? 0) / 1000)} k€`
          : `${Math.round(result.passoireRatio * 100)} % passoires F/G`,
        'Profil Origination CEE / cumac',
      ],
    });
  }

  return explanations;
}
