/** Affichage gratuit vs payant — le gratuit oriente, le payant chiffre et contacte. */

export type BudgetBand = 'xs' | 's' | 'm' | 'l' | 'xl';

const BUDGET_BANDS: { max: number; label: string; band: BudgetBand }[] = [
  { max: 200_000, label: '< 200 k€', band: 'xs' },
  { max: 400_000, label: '200 – 400 k€', band: 's' },
  { max: 800_000, label: '400 – 800 k€', band: 'm' },
  { max: 1_500_000, label: '800 k€ – 1,5 M€', band: 'l' },
  { max: Infinity, label: '> 1,5 M€', band: 'xl' },
];

export function getBudgetBand(capex: number): BudgetBand {
  const v = Number.isFinite(capex) ? capex : 0;
  return BUDGET_BANDS.find((b) => v < b.max)?.band ?? 'xl';
}

export function formatBudgetRange(capex: number): string {
  const v = Number.isFinite(capex) ? capex : 0;
  return BUDGET_BANDS.find((b) => v < b.max)?.label ?? '> 1,5 M€';
}

export type SubventionLevel = 'elevee' | 'moderee' | 'faible';

export function getSubventionLevel(ratio: number): SubventionLevel {
  const r = Number.isFinite(ratio) ? ratio : 0;
  if (r >= 0.55) return 'elevee';
  if (r >= 0.35) return 'moderee';
  return 'faible';
}

const SUBVENTION_LABELS: Record<SubventionLevel, string> = {
  elevee: 'Subventions élevées',
  moderee: 'Subventions modérées',
  faible: 'Subventions limitées',
};

export function formatSubventionLevel(ratio: number): string {
  return SUBVENTION_LABELS[getSubventionLevel(ratio)];
}

export interface DpeProfileSummary {
  total: number;
  passoires: number;
  worstClass: string;
  label: string;
}

export function summarizeDpeProfile(classes: string[]): DpeProfileSummary {
  const normalized = classes.map((c) => String(c ?? '').trim().toUpperCase()).filter(Boolean);
  const total = normalized.length;
  const passoires = normalized.filter((c) => c === 'F' || c === 'G').length;
  const order = ['G', 'F', 'E', 'D', 'C', 'B', 'A'];
  const worstClass = order.find((c) => normalized.includes(c)) ?? '—';

  if (!total) {
    return { total: 0, passoires: 0, worstClass: '—', label: 'Profil énergétique indisponible' };
  }

  const label =
    passoires === total
      ? `${passoires} passoire${passoires > 1 ? 's' : ''} F/G`
      : `${passoires} passoire${passoires > 1 ? 's' : ''} F/G sur ${total} école${total > 1 ? 's' : ''}`;

  return { total, passoires, worstClass, label };
}

/** Ce que le gratuit peut afficher sur un territoire (sans montants exacts). */
export interface TerritoryFreePreview {
  budgetRange: string;
  budgetBand: BudgetBand;
  subventionLevel: string;
  dpeProfile: DpeProfileSummary;
}

export function buildTerritoryFreePreview(input: {
  packCapexTotal: number;
  subventionRatio: number;
  dpeClasses: string[];
}): TerritoryFreePreview {
  return {
    budgetRange: formatBudgetRange(input.packCapexTotal),
    budgetBand: getBudgetBand(input.packCapexTotal),
    subventionLevel: formatSubventionLevel(input.subventionRatio),
    dpeProfile: summarizeDpeProfile(input.dpeClasses),
  };
}
