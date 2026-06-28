/**
 * Scorecard comparatif déterministe (sans IA) — aide à prioriser les territoires.
 * Pondération calibrée pour directeurs commerciaux BTP / consultants AMO.
 */
import type { ClosingLevel, MarketplacePack } from './types';

/** Labels affichés — le type interne ClosingLevel utilise l'identifiant ASCII `tiede`. */
const TEMPERATURE_LABEL: Record<ClosingLevel, string> = {
  chaud: 'Chaud',
  tiede: 'Tiède',
  froid: 'Froid',
};

export interface ScorecardDimension {
  id: string;
  label: string;
  weight: number;
  score: number;
  maxScore: number;
  detail: string;
}

export interface TerritoryScorecard {
  packId: string;
  totalScore: number;
  maxTotal: number;
  grade: 'A' | 'B' | 'C' | 'D';
  rank: number;
  dimensions: ScorecardDimension[];
  highlights: string[];
}

const GRADE_THRESHOLDS = [
  { min: 80, grade: 'A' as const },
  { min: 65, grade: 'B' as const },
  { min: 50, grade: 'C' as const },
  { min: 0, grade: 'D' as const },
];

function gradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' {
  for (const t of GRADE_THRESHOLDS) {
    if (score >= t.min) return t.grade;
  }
  return 'D';
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function scoreRadar(pack: MarketplacePack): ScorecardDimension {
  const score = clamp(Math.round((pack.radarScore / 100) * 25), 0, 25);
  return {
    id: 'radar',
    label: 'Score Radar',
    weight: 25,
    score,
    maxScore: 25,
    detail: `Grade ${pack.radarGrade} · ${pack.radarScore}/100`,
  };
}

function scoreCapex(pack: MarketplacePack): ScorecardDimension {
  const capex = pack.packCapexTotal;
  let score = 8;
  if (capex >= 1_500_000) score = 20;
  else if (capex >= 1_000_000) score = 17;
  else if (capex >= 600_000) score = 14;
  else if (capex >= 400_000) score = 11;
  return {
    id: 'capex',
    label: 'Volume CAPEX',
    weight: 20,
    score,
    maxScore: 20,
    detail: capex > 0 ? `${Math.round(capex / 1000)} k€` : pack.budgetRange,
  };
}

function scoreSubventions(pack: MarketplacePack): ScorecardDimension {
  const ratio = pack.subventionRatio;
  const score = clamp(Math.round(ratio * 20), 0, 20);
  return {
    id: 'subventions',
    label: 'Taux subventions',
    weight: 20,
    score,
    maxScore: 20,
    detail: ratio > 0 ? `${Math.round(ratio * 100)} %` : pack.subventionLevelLabel,
  };
}

function scoreUrgency(pack: MarketplacePack): ScorecardDimension {
  const level: ClosingLevel = pack.temperatureLevel;
  let score = 5;
  if (pack.hasActiveTender) score += 10;
  if (pack.isHot || level === 'chaud') score += 8;
  else if (level === 'tiede') score += 4;
  if (pack.statutProjetEpci === 'PROJET_GLOBAL_VALIDE') score += 2;
  score = clamp(score, 0, 20);
  return {
    id: 'urgency',
    label: 'Urgence marché',
    weight: 20,
    score,
    maxScore: 20,
    detail: pack.hasActiveTender
      ? 'AO actif détecté'
      : pack.isHot
        ? 'Lead chaud'
        : TEMPERATURE_LABEL[level],
  };
}

function scoreRoi(pack: MarketplacePack): ScorecardDimension {
  const roi = pack.roiAnnees;
  let score = 10;
  if (roi > 0 && roi <= 8) score = 15;
  if (roi > 0 && roi <= 5) score = 15;
  return {
    id: 'roi',
    label: 'ROI Fonds Vert',
    weight: 15,
    score,
    maxScore: 15,
    detail: roi > 0 ? `${roi.toFixed(1)} ans` : '—',
  };
}

export function computeTerritoryScorecard(pack: MarketplacePack): TerritoryScorecard {
  const dimensions = [
    scoreRadar(pack),
    scoreCapex(pack),
    scoreSubventions(pack),
    scoreUrgency(pack),
    scoreRoi(pack),
  ];

  const totalScore = dimensions.reduce((s, d) => s + d.score, 0);
  const maxTotal = dimensions.reduce((s, d) => s + d.maxScore, 0);
  const pct = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;

  const highlights: string[] = [];
  if (pack.hasActiveTender) highlights.push('Appel d\'offres actif');
  if (pack.isQualified) highlights.push('Deal Room qualifié');
  if (pack.radarGrade === 'A') highlights.push('Radar A');
  if (pack.batimentCount >= 5) highlights.push(`${pack.batimentCount} écoles — effet pack`);

  return {
    packId: pack.packId,
    totalScore: pct,
    maxTotal: 100,
    grade: gradeFromScore(pct),
    rank: 0,
    dimensions,
    highlights,
  };
}

export function rankTerritoryScorecards(
  packs: MarketplacePack[],
): TerritoryScorecard[] {
  const cards = packs.map(computeTerritoryScorecard);
  cards.sort((a, b) => b.totalScore - a.totalScore);
  return cards.map((c, i) => ({ ...c, rank: i + 1 }));
}

export function pickRecommendedPackId(cards: TerritoryScorecard[]): string | null {
  if (!cards.length) return null;
  return cards[0]?.packId ?? null;
}
