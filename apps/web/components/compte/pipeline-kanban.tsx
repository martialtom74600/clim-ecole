'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { TRANSITION } from '@/lib/motion';
import { formatEur } from '@/lib/format';
import {
  PACK_PIPELINE_COLUMNS,
  PACK_PIPELINE_STATUSES,
  computePipelineStats,
  nextPipelineStatus,
  pipelineColumnLabel,
  type PackPipelineStatus,
  type PipelinePortfolioStats,
  type PipelineTerritoryCard,
} from '@/lib/pipeline-crm';
import { ActiveTenderBadge } from '@/components/marketplace/active-tender-badge';
import { cn } from '@/lib/utils';

interface PipelineResponse {
  territories: PipelineTerritoryCard[];
  stats: PipelinePortfolioStats;
}

export function PipelineKanbanBoard() {
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/pipeline');
      if (!res.ok) throw new Error('Chargement impossible');
      setData(await res.json());
    } catch {
      setError('Impossible de charger le pipeline.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(packId: string, status: PackPipelineStatus) {
    setUpdatingId(packId);
    setError(null);
    try {
      const res = await fetch('/api/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, status }),
      });
      if (!res.ok) throw new Error('Mise à jour refusée');
      await load();
    } catch {
      setError('Échec de la mise à jour du statut.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateMeta(
    packId: string,
    patch: { note?: string | null; nextFollowUp?: string | null },
  ) {
    setUpdatingId(packId);
    setError(null);
    try {
      const res = await fetch('/api/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, ...patch }),
      });
      if (!res.ok) throw new Error('Mise à jour refusée');
      await load();
    } catch {
      setError('Échec de la mise à jour.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center gap-2 p-12 text-ink-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement du pipeline…
      </div>
    );
  }

  if (!data?.territories.length) {
    return (
      <div className="card p-8 text-center">
        <p className="font-medium text-ink">Aucun territoire dans votre pipeline</p>
        <p className="mt-2 text-sm text-ink-muted">
          Débloquez un dossier depuis l&apos;explorateur pour le suivre ici.
        </p>
        <Link href="/explorer" className="btn-primary mt-6 inline-flex">
          Ouvrir l&apos;explorateur
        </Link>
      </div>
    );
  }

  const stats = data.stats ?? computePipelineStats(data.territories);

  return (
    <div className="space-y-6">
      <PipelineKpiBar stats={stats} />

      {error && (
        <p className="rounded-lg border border-heat-border bg-heat-soft px-4 py-3 text-sm text-heat-text">
          {error}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-5">
        {PACK_PIPELINE_COLUMNS.map((column, i) => {
          const cards = data.territories.filter((t) => t.pipelineStatus === column.id);
          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...TRANSITION.base, delay: i * 0.05 }}
              className={cn('rounded-xl border-2 p-3', column.headerClass)}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{column.label}</p>
                  <p className="text-[10px] text-ink-muted">{column.hint}</p>
                </div>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold tabular-nums">
                  {cards.length}
                </span>
              </div>

              <div className="space-y-2">
                {cards.map((card, ci) => (
                  <motion.article
                    key={card.packId}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...TRANSITION.base, delay: Math.min(ci, 6) * 0.03 }}
                    className="rounded-lg border border-line bg-white p-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start gap-1.5">
                      {card.hasActiveTender && <ActiveTenderBadge size="sm" />}
                    </div>
                    <p className="mt-1 font-medium text-sm text-ink">{card.name}</p>
                    <p className="text-xs text-ink-muted">
                      {card.department}
                      {card.capex ? ` · ${formatEur(card.capex, true)}` : ''}
                    </p>

                    <div className="mt-2 space-y-1.5">
                      <input
                        type="text"
                        defaultValue={card.note ?? ''}
                        placeholder="Note interne…"
                        disabled={updatingId === card.packId}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (card.note ?? '')) {
                            void updateMeta(card.packId, { note: v || null });
                          }
                        }}
                        className="w-full rounded-md border border-line bg-surface-sunken px-2 py-1 text-[11px]"
                      />
                      <input
                        type="date"
                        defaultValue={card.nextFollowUp?.slice(0, 10) ?? ''}
                        disabled={updatingId === card.packId}
                        onChange={(e) =>
                          void updateMeta(card.packId, {
                            nextFollowUp: e.target.value ? `${e.target.value}T09:00:00.000Z` : null,
                          })
                        }
                        className="w-full rounded-md border border-line bg-surface-sunken px-2 py-1 text-[11px]"
                        aria-label="Prochaine relance"
                      />
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                      <select
                        value={card.pipelineStatus}
                        disabled={updatingId === card.packId}
                        onChange={(e) =>
                          void updateStatus(card.packId, e.target.value as PackPipelineStatus)
                        }
                        className="w-full rounded-md border border-line bg-surface-sunken px-2 py-1.5 text-xs"
                        aria-label={`Statut pipeline pour ${card.name}`}
                      >
                        {PACK_PIPELINE_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {pipelineColumnLabel(s)}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        {nextPipelineStatus(card.pipelineStatus) && (
                          <button
                            type="button"
                            disabled={updatingId === card.packId}
                            onClick={() =>
                              void updateStatus(
                                card.packId,
                                nextPipelineStatus(card.pipelineStatus)!,
                              )
                            }
                            className="btn-secondary flex-1 !py-1.5 !text-[11px]"
                          >
                            Avancer →
                          </button>
                        )}
                        <Link
                          href={`/explorer/${card.packId}`}
                          className="btn-ghost !px-2 !py-1.5 !text-[11px]"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}

                {cards.length === 0 && (
                  <p className="py-6 text-center text-[11px] text-ink-subtle">Vide</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineKpiBar({ stats }: { stats: PipelinePortfolioStats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi label="Territoires actifs" value={String(stats.total)} />
      <Kpi label="CAPEX en cours" value={formatEur(stats.capexActive, true)} hint="Contacté + RDV" />
      <Kpi label="CAPEX gagné" value={formatEur(stats.capexWon, true)} accent />
      <Kpi
        label="Taux de conversion"
        value={stats.byStatus.won + stats.byStatus.lost > 0 ? `${stats.winRatePct} %` : '—'}
        hint="Gagné / (Gagné + Perdu)"
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className={cn('mt-1 text-xl font-bold tabular-nums', accent && 'text-ink')}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[10px] text-ink-subtle">{hint}</p>}
    </div>
  );
}
