import type { ClosingLevel } from './types';

export interface RadarScoreInput {
  packCapexTotal: number;
  subventionRatio: number;
  passoireRatio: number;
  temperatureLevel: ClosingLevel;
  statutProjetEpci: string;
  roiAnnees: number;
  batimentCount: number;
}

export interface RadarScoreResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  factors: string[];
}

export function computeRadarScore(input: RadarScoreInput): RadarScoreResult {
  const factors: string[] = [];
  let score = 0;

  // CAPEX (0–30)
  if (input.packCapexTotal >= 1_000_000) {
    score += 30;
    factors.push('CAPEX > 1 M€ — volume chantier majeur');
  } else if (input.packCapexTotal >= 500_000) {
    score += 22;
    factors.push('CAPEX > 500 k€ — pack significatif');
  } else if (input.packCapexTotal >= 400_000) {
    score += 15;
    factors.push('CAPEX > 400 k€ — seuil BTP');
  } else {
    score += 5;
  }

  // Température (0–25)
  if (input.temperatureLevel === 'chaud') {
    score += 25;
    factors.push('Température chaude — closing prioritaire');
  } else if (input.temperatureLevel === 'tiede') {
    score += 15;
    factors.push('Température tiède — à qualifier');
  } else {
    score += 5;
  }

  // Subventions (0–25)
  if (input.subventionRatio >= 0.5) {
    score += 25;
    factors.push('Ratio subventions > 50 % — montage AMO fort');
  } else if (input.subventionRatio >= 0.4) {
    score += 18;
    factors.push('Ratio subventions > 40 % — éligible AMO');
  } else if (input.subventionRatio >= 0.25) {
    score += 10;
  }

  // Passoires (0–10)
  if (input.passoireRatio >= 0.75) {
    score += 10;
    factors.push('> 75 % passoires F/G — potentiel BE');
  } else if (input.passoireRatio >= 0.5) {
    score += 6;
  }

  // Maturité projet (0–10)
  if (input.statutProjetEpci === 'PROJET_GLOBAL_VALIDE') {
    score += 10;
    factors.push('Projet global validé — maturité élevée');
  } else if (input.batimentCount >= 3) {
    score += 4;
  }

  // ROI bonus (0–5)
  if (input.roiAnnees > 0 && input.roiAnnees <= 8) {
    score += 5;
    factors.push(`ROI fonds ${input.roiAnnees.toFixed(1)} ans — attractif mairie`);
  } else if (input.roiAnnees > 0 && input.roiAnnees <= 12) {
    score += 2;
  }

  score = Math.min(100, Math.max(0, score));

  const grade: RadarScoreResult['grade'] =
    score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 45 ? 'C' : 'D';

  return { score, grade, factors };
}
