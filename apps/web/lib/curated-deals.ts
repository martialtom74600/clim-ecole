import { PERSONA_THRESHOLDS } from './persona-engine';
import type { MarketplacePack } from './types';

/** Score minimum pour entrer dans le Deal Room curated */
export const QUALIFIED_MIN_SCORE = 65;

/** Grades éligibles au Deal Room */
export const QUALIFIED_GRADES = new Set(['A', 'B']);

export function isQualifiedDeal(pack: Pick<MarketplacePack, 'packCapexTotal' | 'radarScore' | 'radarGrade'>): boolean {
  return (
    pack.packCapexTotal >= PERSONA_THRESHOLDS.BTP_CAPEX_MIN &&
    (QUALIFIED_GRADES.has(pack.radarGrade) || pack.radarScore >= QUALIFIED_MIN_SCORE)
  );
}

export function packMatchesExplorerFilter(
  pack: MarketplacePack,
  filter: 'all' | 'qualified' | 'watchlist',
  watchIds: string[],
): boolean {
  if (filter === 'watchlist') return watchIds.includes(pack.packId);
  if (filter === 'qualified') return isQualifiedDeal(pack);
  return true;
}
