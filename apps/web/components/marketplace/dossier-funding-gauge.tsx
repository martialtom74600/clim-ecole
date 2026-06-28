import { COPY } from '@/lib/copy';
import { formatEur, formatPct } from '@/lib/format';

export function DossierFundingGauge({
  packCapexTotal,
  subventionsTotal,
  subventionRatio,
  racTotal,
  roiAnnees,
}: {
  packCapexTotal: number;
  subventionsTotal: number;
  subventionRatio: number;
  racTotal: number;
  roiAnnees: number;
}) {
  const subPct = Math.min(100, subventionRatio * 100);
  const racPct = Math.min(100 - subPct, (racTotal / (packCapexTotal || 1)) * 100);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-900">Répartition financement</p>
      <div className="mt-3 flex h-6 overflow-hidden rounded-md">
        {subPct > 0 && (
          <div
            className="flex min-w-[2.5rem] items-center justify-center bg-emerald-600 text-[10px] font-bold text-white"
            style={{ width: `${subPct}%` }}
          >
            {subPct >= 14 ? `${Math.round(subPct)}%` : ''}
          </div>
        )}
        {racPct > 0 && (
          <div
            className="flex flex-1 items-center justify-center bg-orange-500 text-[10px] font-bold text-white"
            style={{ width: `${racPct}%` }}
          >
            {racPct >= 14 ? `${Math.round(racPct)}% RAC` : ''}
          </div>
        )}
      </div>
      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <dt className="text-slate-500">{COPY.subventions}</dt>
          <dd className="font-semibold tabular-nums text-slate-900">
            {formatEur(subventionsTotal, true)}{' '}
            <span className="font-normal text-slate-400">({formatPct(subventionRatio)})</span>
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">{COPY.resteAChargeAfterSubs}</dt>
          <dd className="font-semibold tabular-nums text-orange-600">{formatEur(racTotal, true)}</dd>
        </div>
        {roiAnnees > 0 && (
          <div className="flex justify-between">
            <dt className="text-slate-500">ROI Fonds Vert</dt>
            <dd className="font-semibold text-emerald-600">{roiAnnees.toFixed(1)} ans</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
