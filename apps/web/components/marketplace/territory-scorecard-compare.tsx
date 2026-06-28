import Link from 'next/link';
import { Trophy } from 'lucide-react';
import type { MarketplacePack } from '@/lib/types';
import { formatEur, formatInt, formatPct } from '@/lib/format';
import { COPY } from '@/lib/copy';
import { PersonaBadgeGroup } from '@/components/brand/personas';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';
import { ActiveTenderBadge } from '@/components/marketplace/active-tender-badge';
import {
  pickRecommendedPackId,
  rankTerritoryScorecards,
  type TerritoryScorecard,
} from '@/lib/territory-scorecard';
import { cn } from '@/lib/utils';

export function TerritoryScorecardCompare({ packs }: { packs: MarketplacePack[] }) {
  const scorecards = rankTerritoryScorecards(packs);
  const recommendedId = pickRecommendedPackId(scorecards);
  const byPackId = new Map(scorecards.map((s) => [s.packId, s]));

  return (
    <div className="space-y-8">
      {recommendedId && (
        <div className="card border-radar-signal/40 bg-radar-canvas p-5 md:p-6">
          <div className="flex items-start gap-3">
            <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-radar-signal" />
            <div>
              <p className="font-semibold text-radar-text">Recommandation Scorecard</p>
              <p className="mt-1 text-sm text-radar-muted">
                Classement déterministe (Radar, CAPEX, subventions, urgence AO, ROI) — sans IA.
                Priorisez{' '}
                <strong className="text-radar-text">
                  {packs.find((p) => p.packId === recommendedId)?.publicName}
                </strong>{' '}
                pour maximiser vos chances de closing.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {packs.map((pack) => {
          const score = byPackId.get(pack.packId)!;
          const isWinner = pack.packId === recommendedId;
          return (
            <div
              key={pack.packId}
              className={cn(
                'card overflow-hidden',
                isWinner && 'ring-2 ring-radar-signal/50',
              )}
            >
              <div className="border-b border-radar-border p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <RadarScoreBadge score={pack.radarScore} grade={pack.radarGrade} previewOnly />
                  {pack.hasActiveTender && <ActiveTenderBadge size="sm" />}
                  {isWinner && (
                    <span className="rounded-md bg-radar-signal/10 px-2 py-0.5 text-[10px] font-bold uppercase text-radar-signal">
                      #1 Scorecard
                    </span>
                  )}
                </div>
                <p className="mt-3 font-semibold">{pack.publicName}</p>
                <p className="text-xs text-radar-muted">{pack.department}</p>
                <PersonaBadgeGroup personas={pack.personas} className="mt-2" />

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold tabular-nums text-radar-signal">
                      {score.totalScore}
                      <span className="text-lg text-radar-muted">/100</span>
                    </p>
                    <p className="text-xs text-radar-muted">Grade scorecard {score.grade}</p>
                  </div>
                  <span className="text-sm font-medium text-radar-muted">Rang #{score.rank}</span>
                </div>
              </div>

              <div className="p-5">
                <dl className="space-y-2 text-sm">
                  <ScoreRow label="Budget" value={pack.packCapexTotal > 0 ? formatEur(pack.packCapexTotal, true) : pack.budgetRange} />
                  <ScoreRow
                    label={COPY.subventions}
                    value={pack.subventionRatio > 0 ? formatPct(pack.subventionRatio) : pack.subventionLevelLabel}
                  />
                  <ScoreRow label={COPY.ecoles} value={formatInt(pack.batimentCount)} />
                  <ScoreRow label="ROI Fonds" value={pack.roiAnnees > 0 ? `${pack.roiAnnees.toFixed(1)} ans` : '—'} />
                </dl>

                <div className="mt-4 space-y-2">
                  {score.dimensions.map((d) => (
                    <DimensionBar key={d.id} dimension={d} />
                  ))}
                </div>

                {score.highlights.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {score.highlights.map((h) => (
                      <li
                        key={h}
                        className="rounded-md bg-radar-elevated px-2 py-0.5 text-[10px] text-radar-muted"
                      >
                        {h}
                      </li>
                    ))}
                  </ul>
                )}

                <Link href={`/explorer/${pack.packId}`} className="btn-primary mt-5 w-full text-center text-sm">
                  {COPY.viewDossier}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-radar-border bg-radar-elevated text-[11px] uppercase tracking-wide text-radar-muted">
              <th className="px-4 py-3">Critère</th>
              {packs.map((p) => (
                <th key={p.packId} className="px-4 py-3 text-right">
                  {p.publicName.slice(0, 24)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-radar-border">
            {scorecards[0]?.dimensions.map((_, dimIdx) => (
              <tr key={dimIdx}>
                <td className="px-4 py-3 font-medium">{scorecards[0].dimensions[dimIdx].label}</td>
                {packs.map((p) => {
                  const dim = byPackId.get(p.packId)?.dimensions[dimIdx];
                  return (
                    <td key={p.packId} className="px-4 py-3 text-right tabular-nums">
                      {dim ? `${dim.score}/${dim.maxScore}` : '—'}
                      <p className="text-[10px] text-radar-subtle">{dim?.detail}</p>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-radar-canvas font-semibold">
              <td className="px-4 py-3">Total Scorecard</td>
              {packs.map((p) => (
                <td key={p.packId} className="px-4 py-3 text-right tabular-nums text-radar-signal">
                  {byPackId.get(p.packId)?.totalScore}/100
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-radar-muted">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function DimensionBar({ dimension }: { dimension: TerritoryScorecard['dimensions'][number] }) {
  const pct = dimension.maxScore > 0 ? (dimension.score / dimension.maxScore) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px]">
        <span className="text-radar-muted">{dimension.label}</span>
        <span className="tabular-nums text-radar-text">
          {dimension.score}/{dimension.maxScore}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-radar-elevated">
        <div className="h-full bg-radar-signal transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
