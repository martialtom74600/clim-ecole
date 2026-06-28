'use client';

import { Minus, Equal } from 'lucide-react';
import { formatEur, formatPct } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Waterfall: Budget travaux  −  Subventions  =  Reste à charge.
 * Replaces the old cramped gauge with a single readable financing story.
 */
export function DossierFundingWaterfall({
  capex,
  subventionsTotal,
  subventionRatio,
  racTotal,
  roiAnnees,
}: {
  capex: number;
  subventionsTotal: number;
  subventionRatio: number;
  racTotal: number;
  roiAnnees: number;
}) {
  const base = capex || 1;
  const subPct = Math.max(0, Math.min(100, (subventionsTotal / base) * 100));
  const racPct = Math.max(0, Math.min(100 - subPct, (racTotal / base) * 100));

  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Répartition du financement</p>
        {roiAnnees > 0 && (
          <span className="badge bg-positive-soft text-positive-text ring-1 ring-inset ring-positive-border">
            ROI {roiAnnees.toFixed(1)} ans
          </span>
        )}
      </div>

      {/* Stacked bar */}
      <div className="mt-3 flex h-8 overflow-hidden rounded-lg ring-1 ring-inset ring-line">
        {subPct > 0 && (
          <div
            className="flex items-center justify-center bg-positive text-[11px] font-semibold text-white transition-[width] duration-500"
            style={{ width: `${subPct}%` }}
          >
            {subPct >= 16 ? `${Math.round(subPct)} %` : ''}
          </div>
        )}
        {racPct > 0 && (
          <div
            className="flex flex-1 items-center justify-center bg-warning text-[11px] font-semibold text-white transition-[width] duration-500"
            style={{ width: `${racPct}%` }}
          >
            {racPct >= 16 ? `${Math.round(racPct)} % RAC` : ''}
          </div>
        )}
      </div>

      {/* Waterfall steps */}
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1">
        <Step label="Budget travaux" value={formatEur(capex, true)} tone="neutral" />
        <Operator icon={<Minus className="h-3.5 w-3.5" />} />
        <Step
          label="Subventions"
          value={formatEur(subventionsTotal, true)}
          sub={formatPct(subventionRatio)}
          tone="positive"
        />
        <Operator icon={<Equal className="h-3.5 w-3.5" />} />
        <Step label="Reste à charge" value={formatEur(racTotal, true)} tone="warning" />
      </div>
    </div>
  );
}

function Step({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: 'neutral' | 'positive' | 'warning';
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-2.5 py-2 text-center',
        tone === 'neutral' && 'border-line bg-surface-sunken',
        tone === 'positive' && 'border-positive-border bg-positive-soft',
        tone === 'warning' && 'border-warning-border bg-warning-soft',
      )}
    >
      <p
        className={cn(
          'text-[10px] font-medium uppercase tracking-wide',
          tone === 'neutral' && 'text-ink-muted',
          tone === 'positive' && 'text-positive-text',
          tone === 'warning' && 'text-warning-text',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 font-mono text-sm font-bold tabular-nums',
          tone === 'neutral' && 'text-ink',
          tone === 'positive' && 'text-positive-text',
          tone === 'warning' && 'text-warning-text',
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-ink-subtle">{sub}</p>}
    </div>
  );
}

function Operator({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
      {icon}
    </div>
  );
}
