'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { MarketplaceMgpeSummary } from '@/lib/types';
import { formatEur } from '@/lib/format';

export function DossierMgpeSection({ mgpe }: { mgpe: MarketplaceMgpeSummary }) {
  const hasFigures =
    mgpe.loyerLtEuros > 0 ||
    mgpe.redevanceFtEuros > 0 ||
    mgpe.dureeContratAns > 0 ||
    mgpe.gainNetContractuelEuros > 0;

  const pitchText = [mgpe.argumentaireMgpePd, mgpe.argumentaireLoiElan]
    .filter(Boolean)
    .join('\n\n');

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

function CopyPitchButton({ text }: { text: string }) {
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
      className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/80 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm transition-colors hover:bg-emerald-50"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" />
          Copié !
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copier pour mon pitch
        </>
      )}
    </button>
  );
}

function PitchBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-emerald-200/60 bg-white/80 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-emerald-950">{title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{body}</p>
    </div>
  );
}

function MgpeKpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-emerald-200/50 bg-white/90 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-800/70">{label}</p>
      <p
        className={`mt-1 text-lg font-bold tabular-nums ${accent ? 'text-emerald-700' : 'text-emerald-950'}`}
      >
        {value}
      </p>
    </div>
  );
}
