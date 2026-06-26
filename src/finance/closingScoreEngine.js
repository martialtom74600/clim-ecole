/** Score d'éligibilité closing (0–100) */

const DPE_SCORE = { G: 100, F: 100, E: 70, D: 40, C: 20, B: 10, A: 0 };

function scoreArtisanDistance(km) {
  const d = Number(km);
  if (Number.isNaN(d) || d < 0) return 0;
  if (d <= 5) return 100;
  if (d >= 50) return 0;
  return Math.round(100 * (1 - (d - 5) / 45));
}

function scoreGainNetMairie(euros) {
  const g = Number(euros);
  if (Number.isNaN(g) || g <= 0) return 0;
  if (g >= 30_000) return 100;
  return Math.round((g / 30_000) * 100);
}

function scoreDpeGrade(grade) {
  const letter = String(grade ?? '').trim().toUpperCase().charAt(0);
  return DPE_SCORE[letter] ?? 30;
}

function scorePopulation(population) {
  const pop = Number(population);
  if (Number.isNaN(pop) || pop <= 0) return 50;
  if (pop < 5_000) return 100;
  if (pop >= 50_000) return 0;
  return Math.round(100 * (1 - (pop - 5_000) / 45_000));
}

export function computeClosingScore({ distanceKm, gainNetMairieEuros, classeDpe, population }) {
  const score = Math.round(
    scoreArtisanDistance(distanceKm) * 0.35 +
      scoreGainNetMairie(gainNetMairieEuros) * 0.3 +
      scoreDpeGrade(classeDpe) * 0.2 +
      scorePopulation(population) * 0.15,
  );
  return Math.min(100, Math.max(0, score));
}

export function closingTemperatureFromScore(score) {
  const s = Number(score) || 0;
  if (s >= 75) {
    return { emoji: '🔥', label: 'Chaud', key: 'hot', score: s };
  }
  if (s >= 50) {
    return { emoji: '⚡', label: 'Tiède', key: 'warm', score: s };
  }
  return { emoji: '❄', label: 'Froid', key: 'cold', score: s };
}

export function attachClosingScoreFields(row, population) {
  const score = computeClosingScore({
    distanceKm: row.Artisan_Distance_KM,
    gainNetMairieEuros: row.Gain_Net_Annuel_Mairie_Euros,
    classeDpe: row.Classe_DPE,
    population,
  });
  const temp = closingTemperatureFromScore(score);
  return {
    ...row,
    Score_Eligibilite_Closing: score,
    Closing_Temperature: `${temp.emoji} ${temp.label}`,
    _closingTempKey: temp.key,
  };
}

export function aggregateCommuneClosingScore(schoolRows) {
  if (!schoolRows?.length) return { score: 0, temperature: closingTemperatureFromScore(0) };
  const maxScore = Math.max(...schoolRows.map((r) => r.Score_Eligibilite_Closing ?? 0));
  return { score: maxScore, temperature: closingTemperatureFromScore(maxScore) };
}
