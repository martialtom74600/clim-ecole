/**
 * Moteur de tri algorithmique — Radar de prospection
 * Taggage multi-personas par deal (BTP · BE · AMO)
 */

import type { ClientPersona } from './brand';

export const PERSONA_THRESHOLDS = {
  /** Volume & Travaux — cible BTP */
  BTP_CAPEX_MIN: 400_000,
  /** Montage Financier — cible AMO */
  AMO_SUBVENTION_RATIO_MIN: 0.4,
  /** Ingénierie & Audit — surface moyenne par bâtiment (m²) */
  BE_SURFACE_MAX_M2: 1_500,
  /** Part minimale de bâtiments F/G pour tag BE */
  BE_PASSOIRE_MAJORITY: 0.5,
} as const;

const PASSOIRE_DPE = new Set(['F', 'G']);

export interface DealPersonaInput {
  packCapexTotal: number;
  subventionsTotal: number;
  statutProjetEpci: string;
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
}

function isPassoireDpe(classe: string): boolean {
  return PASSOIRE_DPE.has(classe.trim().toUpperCase());
}

/** Tag automatique — un deal peut cumuler plusieurs profils acheteurs */
export function inferDealPersona(deal: DealPersonaInput): DealPersonaResult {
  const { packCapexTotal, subventionsTotal, statutProjetEpci, batiments } = deal;
  const personas: ClientPersona[] = [];

  const subventionRatio =
    packCapexTotal > 0 ? subventionsTotal / packCapexTotal : 0;

  const passoireCount = batiments.filter((b) => isPassoireDpe(b.classeDpe)).length;
  const passoireRatio =
    batiments.length > 0 ? passoireCount / batiments.length : 0;

  const avgSurfaceM2 =
    batiments.length > 0
      ? batiments.reduce((s, b) => s + b.surfaceM2, 0) / batiments.length
      : 0;

  // Volume & Travaux (BTP)
  if (packCapexTotal > PERSONA_THRESHOLDS.BTP_CAPEX_MIN) {
    personas.push('btp');
  }

  // Ingénierie & Audit (BE) — majorité F/G + petites surfaces
  if (
    passoireRatio > PERSONA_THRESHOLDS.BE_PASSOIRE_MAJORITY &&
    avgSurfaceM2 < PERSONA_THRESHOLDS.BE_SURFACE_MAX_M2
  ) {
    personas.push('be');
  }

  // Montage Financier (AMO)
  if (
    subventionRatio > PERSONA_THRESHOLDS.AMO_SUBVENTION_RATIO_MIN ||
    statutProjetEpci === 'PROJET_GLOBAL_VALIDE'
  ) {
    personas.push('amo');
  }

  // Fallback : tout deal packagé a un intérêt financier minimum
  if (personas.length === 0) {
    personas.push('amo');
  }

  const primaryPersona = inferPrimaryPersona(personas, {
    packCapexTotal,
    subventionRatio,
    statutProjetEpci,
  });

  return {
    personas,
    primaryPersona,
    subventionRatio,
    passoireRatio,
    avgSurfaceM2,
  };
}

/** Persona principal pour l'affichage carte (priorité métier) */
export function inferPrimaryPersona(
  personas: ClientPersona[],
  ctx: {
    packCapexTotal: number;
    subventionRatio: number;
    statutProjetEpci: string;
  },
): ClientPersona {
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

/** Explainability — pourquoi chaque tag persona a été appliqué */
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
        `Surface moyenne ${Math.round(result.avgSurfaceM2)} m² (< ${PERSONA_THRESHOLDS.BE_SURFACE_MAX_M2} m²)`,
        'Profil Ingénierie & Audit — conseil thermique pointu',
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

  return explanations;
}
