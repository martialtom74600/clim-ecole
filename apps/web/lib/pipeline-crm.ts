/** Pipeline commercial client — statuts sur territoires débloqués */

export const PACK_PIPELINE_STATUSES = [
  'new',
  'contacted',
  'meeting_booked',
  'won',
  'lost',
] as const;

export type PackPipelineStatus = (typeof PACK_PIPELINE_STATUSES)[number];

export interface PackPipelineColumn {
  id: PackPipelineStatus;
  label: string;
  hint: string;
  headerClass: string;
  badgeClass: string;
}

export const PACK_PIPELINE_COLUMNS: PackPipelineColumn[] = [
  {
    id: 'new',
    label: 'Nouveau',
    hint: 'Territoire débloqué — prospection à lancer',
    headerClass: 'border-slate-300 bg-slate-50',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
  {
    id: 'contacted',
    label: 'Contacté',
    hint: 'Premier échange mairie / DGS effectué',
    headerClass: 'border-sky-300 bg-sky-50',
    badgeClass: 'bg-sky-100 text-sky-800',
  },
  {
    id: 'meeting_booked',
    label: 'RDV planifié',
    hint: 'Réunion ou visite technique programmée',
    headerClass: 'border-amber-300 bg-amber-50',
    badgeClass: 'bg-amber-100 text-amber-900',
  },
  {
    id: 'won',
    label: 'Gagné',
    hint: 'Contrat signé ou marché remporté',
    headerClass: 'border-emerald-300 bg-emerald-50',
    badgeClass: 'bg-emerald-100 text-emerald-900',
  },
  {
    id: 'lost',
    label: 'Perdu',
    hint: 'Opportunité abandonnée ou perdue',
    headerClass: 'border-red-200 bg-red-50',
    badgeClass: 'bg-red-100 text-red-800',
  },
];

export function isPackPipelineStatus(value: string): value is PackPipelineStatus {
  return (PACK_PIPELINE_STATUSES as readonly string[]).includes(value);
}

export function nextPipelineStatus(current: PackPipelineStatus): PackPipelineStatus | null {
  const idx = PACK_PIPELINE_STATUSES.indexOf(current);
  if (idx < 0 || idx >= PACK_PIPELINE_STATUSES.length - 2) return null;
  return PACK_PIPELINE_STATUSES[idx + 1];
}

export function pipelineColumnLabel(status: PackPipelineStatus): string {
  return PACK_PIPELINE_COLUMNS.find((c) => c.id === status)?.label ?? status;
}

export interface PipelineTerritoryCard {
  packId: string;
  name: string;
  department?: string;
  capex?: number;
  gainNetMairie?: number;
  pipelineStatus: PackPipelineStatus;
  pipelineUpdatedAt?: string;
  unlockedAt?: string;
  hasActiveTender?: boolean;
}

export interface PipelinePortfolioStats {
  total: number;
  byStatus: Record<PackPipelineStatus, number>;
  capexPipeline: number;
  capexWon: number;
  capexActive: number;
  winRatePct: number;
}

export function computePipelineStats(cards: PipelineTerritoryCard[]): PipelinePortfolioStats {
  const byStatus = Object.fromEntries(
    PACK_PIPELINE_STATUSES.map((s) => [s, 0]),
  ) as Record<PackPipelineStatus, number>;

  let capexPipeline = 0;
  let capexWon = 0;
  let capexActive = 0;

  for (const card of cards) {
    byStatus[card.pipelineStatus] += 1;
    const capex = card.capex ?? 0;
    capexPipeline += capex;
    if (card.pipelineStatus === 'won') capexWon += capex;
    if (card.pipelineStatus === 'meeting_booked' || card.pipelineStatus === 'contacted') {
      capexActive += capex;
    }
  }

  const closed = byStatus.won + byStatus.lost;
  const winRatePct = closed > 0 ? Math.round((byStatus.won / closed) * 100) : 0;

  return {
    total: cards.length,
    byStatus,
    capexPipeline,
    capexWon,
    capexActive,
    winRatePct,
  };
}
