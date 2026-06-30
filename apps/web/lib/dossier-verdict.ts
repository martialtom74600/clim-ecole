import { COPY, SCORE_GRADES } from '@/lib/copy';
import { formatEur, formatPct } from '@/lib/format';
import type { TerritoryFreePreview } from '@/lib/freemium';
import type { ClientPersona } from '@/lib/brand';
import { isClientPersona } from '@/lib/brand';
import type { MarketplacePack } from '@/lib/types';

/** Personas pour lesquels le montage avancé (MGPE, ESCO, CEE) est ouvert par défaut. */
export function showsAdvancedFinance(persona?: ClientPersona): boolean {
  return persona === 'amo' || persona === 'esco' || persona === 'cee';
}

export function resolveActivePersona(
  onboardingPersona?: string,
  packPersonas?: ClientPersona[],
): ClientPersona | undefined {
  if (onboardingPersona && isClientPersona(onboardingPersona)) return onboardingPersona;
  return packPersonas?.[0];
}

function priorityLabel(grade: MarketplacePack['radarGrade']): string {
  if (grade === 'A' || grade === 'B') return 'Territoire prioritaire';
  if (grade === 'C') return 'Territoire à creuser';
  return 'Territoire secondaire';
}

/**
 * Phrase d'interprétation — le « money shot » du dossier.
 * Répond à « est-ce que ce territoire vaut mon temps ? » avant tout chiffre flouté.
 */
export function buildTerritoryVerdict(
  pack: MarketplacePack,
  opts: {
    freePreview?: TerritoryFreePreview;
    unlocked?: boolean;
    packCapexTotal?: number;
    subventionRatio?: number;
  } = {},
): { headline: string; subline: string } {
  const { freePreview, unlocked, packCapexTotal, subventionRatio } = opts;
  const schools = `${pack.batimentCount} école${pack.batimentCount > 1 ? 's' : ''}`;
  const dpe = freePreview?.dpeProfile.worstClass ?? 'F/G';
  const gradeHint = SCORE_GRADES[pack.radarGrade];

  let budgetPhrase: string;
  let aidesPhrase: string;

  if (unlocked && packCapexTotal != null && subventionRatio != null) {
    budgetPhrase = `${formatEur(packCapexTotal, true)} de travaux`;
    aidesPhrase = `~${formatPct(subventionRatio)} finançable via les aides publiques`;
  } else {
    budgetPhrase = `${freePreview?.budgetRange ?? pack.budgetRange} de travaux estimés`;
    const aides = freePreview?.subventionLevel ?? pack.subventionLevelLabel;
    aidesPhrase = `niveau d'aides ${aides.toLowerCase()}`;
  }

  const headline =
    `${priorityLabel(pack.radarGrade)} : ${schools} classées ${dpe}, ${budgetPhrase}, ${aidesPhrase}.`;

  const qualified =
    pack.isQualified ? ` · ${COPY.qualifiedCriteria}` : '';

  const subline = `${COPY.scorePriorite} ${pack.radarGrade} (${pack.radarScore}/100) — ${gradeHint}${qualified}`;

  return { headline, subline };
}
