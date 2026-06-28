import { parseDepartmentCode } from './geo';
import type { MarketplacePack } from './types';
import type { ClientPersona } from './brand';
import { isQualifiedDeal } from './curated-deals';
import { packMatchesPersonaFilter } from './persona-engine';

export interface ExplorerFilterState {
  query: string;
  persona: ClientPersona | 'all' | 'qualified' | 'watchlist';
  minCapex: number;
  minGrade: 'A' | 'B' | 'C' | 'D' | 'all';
  aoOnly: boolean;
  passoiresOnly: boolean;
  mutualizableOnly: boolean;
  minCeeEuros: number;
  departments: string[];
}

export const DEFAULT_EXPLORER_FILTERS: ExplorerFilterState = {
  query: '',
  persona: 'all',
  minCapex: 0,
  minGrade: 'all',
  aoOnly: false,
  passoiresOnly: false,
  mutualizableOnly: false,
  minCeeEuros: 0,
  departments: [],
};

const GRADE_RANK: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };

export function filterExplorerPacks(
  packs: MarketplacePack[],
  filters: ExplorerFilterState,
  watchIds: string[],
): MarketplacePack[] {
  const q = filters.query.trim().toLowerCase();

  return packs.filter((pack) => {
    if (filters.persona === 'watchlist') {
      if (!watchIds.includes(pack.packId)) return false;
    } else if (filters.persona === 'qualified') {
      if (!isQualifiedDeal(pack)) return false;
    } else if (filters.persona !== 'all') {
      if (!packMatchesPersonaFilter(pack.personas, filters.persona)) return false;
    }

    if (filters.minCapex > 0 && pack.packCapexTotal < filters.minCapex && pack.packCapexTotal > 0) {
      return false;
    }

    if (filters.minGrade !== 'all') {
      const minRank = GRADE_RANK[filters.minGrade] ?? 0;
      const packRank = GRADE_RANK[pack.radarGrade] ?? 0;
      if (packRank < minRank) return false;
    }

    if (filters.aoOnly && !pack.hasActiveTender) return false;

    if (filters.mutualizableOnly && !pack.isMutualizable) return false;

    if (filters.minCeeEuros > 0 && (pack.ceeEurosTotal ?? 0) < filters.minCeeEuros) {
      return false;
    }

    if (filters.departments.length > 0) {
      const dept = parseDepartmentCode(pack.department);
      if (!filters.departments.includes(dept)) return false;
    }

    if (q) {
      const hay = `${pack.publicName} ${pack.department} ${pack.budgetRange} ${pack.packId}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}

export function searchExplorerSuggestions(packs: MarketplacePack[], query: string, limit = 8): MarketplacePack[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return filterExplorerPacks(packs, { ...DEFAULT_EXPLORER_FILTERS, query: q }, []).slice(0, limit);
}
