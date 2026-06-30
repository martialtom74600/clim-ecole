'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { MarketplaceMgpeSummary } from '@/lib/types';
import { formatEur } from '@/lib/format';
import { cn } from '@/lib/utils';

export function DossierMgpeSection({
  mgpe,
  compact,
}: {
  mgpe: MarketplaceMgpeSummary;
  compact?: boolean;
}) {
  const hasFigures =
    mgpe.loyerLtEuros > 0 ||
    mgpe.redevanceFtEuros > 0 ||
    mgpe.dureeContratAns > 0 ||
    mgpe.gainNetContractuelEuros > 0;

  const pitchText = [mgpe.argumentaireMgpePd, mgpe.argumentaireLoiElan]
    .filter(Boolean)
    .join('\n\n');

  if (compact) {
    return (
      <div className="flex h-full min-h-0 flex-col rounded-xl border border-line bg-white shadow-card">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <div>
            <p className="text-sm font-semibold text-ink">MGPE-PD & Loi ELAN</p>
            <p className="text-[10px] text-ink-muted">Argumentaire pitch mairie / DGS</p>
          </div>
          {pitchText && <CopyPitchButton text={pitchText} small />}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {hasFigures && (
            <div className="mb-3 grid grid-cols-2 gap-2 xl:grid-cols-3">
              {mgpe.loyerLtEuros > 0 && (
                <MgpeKpi compact label="Loyer LT/an" value={formatEur(mgpe.loyerLtEuros, true)} />
              )}
              {mgpe.redevanceFtEuros > 0 && (
                <MgpeKpi compact label="Redevance FT/an" value={formatEur(mgpe.redevanceFtEuros, true)} />
              )}
              {mgpe.dureeContratAns > 0 && (
                <MgpeKpi compact label="Durée" value={`${mgpe.dureeContratAns} ans`} />
              )}
              {mgpe.gainNetContractuelEuros > 0 && (
                <MgpeKpi
                  compact
                  accent
                  label="Gain net"
                  value={formatEur(mgpe.gainNetContractuelEuros, true)}
                />
              )}
            </div>
          )}

          {mgpe.argumentaireMgpePd ? (
            <PitchBlock compact title="Montage MGPE-PD" body={mgpe.argumentaireMgpePd} />
          ) : (
            <p className="text-xs text-ink-muted">Argumentaire MGPE non renseigné.</p>
          )}

          {mgpe.argumentaireLoiElan && (
            <PitchBlock compact title="Cadre Loi ELAN" body={mgpe.argumentaireLoiElan} className="mt-3" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-raised">
      <div className="border-b border-line bg-surface-sunken px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-ink">Boîte à outils MGPE-PD</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Argumentaire prêt pour votre pitch mairie ou DGS
            </p>
          </div>
          {pitchText && <CopyPitchButton text={pitchText} />}
        </div>
      </div>

      <div className="space-y-6 p-6 md:p-8">
        {hasFigures && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {mgpe.loyerLtEuros > 0 && (
              <MgpeKpi label="Loyer LT / an" value={formatEur(mgpe.loyerLtEuros, true)} />
            )}
            {mgpe.redevanceFtEuros > 0 && (
              <MgpeKpi label="Redevance FT / an" value={formatEur(mgpe.redevanceFtEuros, true)} />
            )}
            {mgpe.partServicesEuros > 0 && (
              <MgpeKpi label="Part services / an" value={formatEur(mgpe.partServicesEuros, true)} />
            )}
            {mgpe.dureeContratAns > 0 && (
              <MgpeKpi label="Durée contrat" value={`${mgpe.dureeContratAns} ans`} />
            )}
            {mgpe.gainNetContractuelEuros > 0 && (
              <MgpeKpi
                label="Gain net contractuel"
                value={formatEur(mgpe.gainNetContractuelEuros, true)}
                accent
              />
            )}
          </div>
        )}

        {mgpe.argumentaireMgpePd ? (
          <PitchBlock title="Montage MGPE-PD" body={mgpe.argumentaireMgpePd} />
        ) : (
          <p className="text-sm text-ink-muted">Argumentaire MGPE non renseigné pour ce territoire.</p>
        )}

        {mgpe.argumentaireLoiElan && (
          <PitchBlock title="Cadre Loi ELAN" body={mgpe.argumentaireLoiElan} />
        )}
      </div>
    </div>
  );
}

function CopyPitchButton({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-white font-semibold text-ink transition-colors hover:bg-surface-muted',
        small ? 'px-2.5 py-1 text-[11px]' : 'px-4 py-2 text-sm shadow-sm',
      )}
    >
      {copied ? (
        <>
          <Check className={cn(small ? 'h-3 w-3' : 'h-4 w-4', 'text-positive')} />
          Copié
        </>
      ) : (
        <>
          <Copy className={small ? 'h-3 w-3' : 'h-4 w-4'} />
          {small ? 'Copier pitch' : 'Copier pour mon pitch'}
        </>
      )}
    </button>
  );
}

function PitchBlock({
  title,
  body,
  compact,
  className,
}: {
  title: string;
  body: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line bg-surface-sunken',
        compact ? 'p-3' : 'p-5',
        className,
      )}
    >
      <h3 className={cn('font-semibold text-ink', compact ? 'text-xs' : 'text-sm')}>{title}</h3>
      <p
        className={cn(
          'whitespace-pre-wrap leading-relaxed text-ink-soft',
          compact ? 'mt-2 text-xs' : 'mt-3 text-sm',
        )}
      >
        {body}
      </p>
    </div>
  );
}

function MgpeKpi({
  label,
  value,
  accent,
  compact,
}: {
  label: string;
  value: string;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border',
        accent ? 'border-positive-border bg-positive-soft' : 'border-line bg-surface-sunken',
        compact ? 'p-2' : 'p-4',
      )}
    >
      <p
        className={cn(
          'text-[10px] font-medium uppercase tracking-wide',
          accent ? 'text-positive-text' : 'text-ink-muted',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'font-mono font-bold tabular-nums',
          compact ? 'mt-0.5 text-sm' : 'mt-1 text-lg',
          accent ? 'text-positive-text' : 'text-ink',
        )}
      >
        {value}
      </p>
    </div>
  );
}
