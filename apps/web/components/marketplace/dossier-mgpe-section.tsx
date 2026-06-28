import type { MarketplaceMgpeSummary } from '@/lib/types';
import { formatEur } from '@/lib/format';

export function DossierMgpeSection({ mgpe }: { mgpe: MarketplaceMgpeSummary }) {
  const hasFigures =
    mgpe.loyerLtEuros > 0 ||
    mgpe.redevanceFtEuros > 0 ||
    mgpe.dureeContratAns > 0 ||
    mgpe.gainNetContractuelEuros > 0;

  return (
    <div className="card mb-8 overflow-hidden">
      <div className="border-b border-radar-border px-6 py-5">
        <h2 className="font-semibold text-radar-text">Montage MGPE-PD</h2>
        <p className="mt-1 text-sm text-radar-muted">
          Marché global de performance énergétique à paiement différé — chiffrage indicatif pack
        </p>
      </div>
      <div className="p-6 md:p-8">
        {hasFigures && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                label="Gain net contractuel (pack)"
                value={formatEur(mgpe.gainNetContractuelEuros, true)}
                accent
              />
            )}
          </div>
        )}

        {mgpe.argumentaireMgpePd ? (
          <blockquote className="rounded-lg border-l-4 border-radar-signal bg-radar-elevated px-5 py-4 text-sm leading-relaxed text-radar-muted whitespace-pre-wrap">
            {mgpe.argumentaireMgpePd}
          </blockquote>
        ) : (
          <p className="text-sm text-radar-muted">Argumentaire MGPE non renseigné pour ce territoire.</p>
        )}

        {mgpe.argumentaireLoiElan && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-radar-text">Cadre Loi ELAN</h3>
            <blockquote className="mt-2 rounded-lg border-l-4 border-radar-border bg-radar-canvas px-5 py-4 text-sm leading-relaxed text-radar-muted whitespace-pre-wrap">
              {mgpe.argumentaireLoiElan}
            </blockquote>
          </div>
        )}
      </div>
    </div>
  );
}

function MgpeKpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-radar-border bg-radar-canvas p-4">
      <p className="text-xs font-medium text-radar-muted">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${accent ? 'text-radar-signal' : 'text-radar-text'}`}>
        {value}
      </p>
    </div>
  );
}
