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
      <div className="flex h-full min-h-0 flex-col rounded-lg border border-emerald-200/80 bg-emerald-50/30">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-emerald-200/60 px-4 py-2.5">
          <div>
            <p className="text-xs font-semibold text-emerald-950">MGPE-PD & Loi ELAN</p>
            <p className="text-[10px] text-emerald-700/80">Argumentaire pitch mairie / DGS</p>
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
            <p className="text-xs text-emerald-800/70">Argumentaire MGPE non renseigné.</p>
          )}

          {mgpe.argumentaireLoiElan && (
            <PitchBlock compact title="Cadre Loi ELAN" body={mgpe.argumentaireLoiElan} className="mt-3" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-emerald-50/40 shadow-sm">
      <div className="border-b border-emerald-200/60 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-emerald-950">Boîte à outils MGPE-PD</h2>
            <p className="mt-1 text-sm text-emerald-800/80">
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
          <p className="text-sm text-emerald-800/70">Argumentaire MGPE non renseigné pour ce territoire.</p>
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
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-300/80 bg-white font-semibold text-emerald-900 transition-colors hover:bg-emerald-50',
        small ? 'px-2.5 py-1 text-[11px]' : 'px-4 py-2 text-sm shadow-sm',
      )}
    >
      {copied ? (
        <>
          <Check className={cn(small ? 'h-3 w-3' : 'h-4 w-4', 'text-emerald-600')} />
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
        'rounded-lg border border-emerald-200/60 bg-white/90',
        compact ? 'p-3' : 'p-5 shadow-sm',
        className,
      )}
    >
      <h3 className={cn('font-semibold text-emerald-950', compact ? 'text-xs' : 'text-sm')}>{title}</h3>
      <p
        className={cn(
          'whitespace-pre-wrap leading-relaxed text-slate-700',
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
    <div className={cn('rounded-md border border-emerald-200/50 bg-white/90', compact ? 'p-2' : 'p-4')}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-800/70">{label}</p>
      <p
        className={cn(
          'font-bold tabular-nums',
          compact ? 'mt-0.5 text-sm' : 'mt-1 text-lg',
          accent ? 'text-emerald-700' : 'text-emerald-950',
        )}
      >
        {value}
      </p>
    </div>
  );
}
