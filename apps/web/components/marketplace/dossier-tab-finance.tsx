import type { MarketplaceMgpeSummary } from '@/lib/types';
import type { ClientPersona } from '@/lib/brand';
import { COPY } from '@/lib/copy';
import { formatEur } from '@/lib/format';
import { DossierFundingGauge } from '@/components/marketplace/dossier-funding-gauge';
import { RacSimulator } from '@/components/marketplace/rac-simulator';
import { DossierMgpeSection } from '@/components/marketplace/dossier-mgpe-section';
import { PersonaDossierTips } from '@/components/marketplace/persona-dossier-tips';

export function DossierTabFinance({
  packCapexTotal,
  subventionsTotal,
  subventionRatio,
  racTotal,
  resteAChargeTotal,
  gainNetMairieTotal,
  fondsVertPotential,
  roiAnnees,
  capex,
  baseSubventionRatio,
  mgpe,
  personas,
}: {
  packCapexTotal: number;
  subventionsTotal: number;
  subventionRatio: number;
  racTotal: number;
  resteAChargeTotal: number;
  gainNetMairieTotal: number;
  fondsVertPotential: number;
  roiAnnees: number;
  capex: number;
  baseSubventionRatio: number;
  mgpe?: MarketplaceMgpeSummary;
  personas: ClientPersona[];
}) {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 p-4 lg:grid-cols-[3fr_7fr]">
      {/* Colonne gauche 30% */}
      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto lg:overflow-hidden">
        <DossierFundingGauge
          packCapexTotal={packCapexTotal}
          subventionsTotal={subventionsTotal}
          subventionRatio={subventionRatio}
          racTotal={racTotal}
          roiAnnees={roiAnnees}
        />
        <RacSimulator capex={capex} baseSubventionRatio={baseSubventionRatio} embedded />

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs">
          <p className="font-semibold text-slate-900">Indicateurs complémentaires</p>
          <dl className="mt-2 space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-slate-500">{COPY.partFondsVert}</dt>
              <dd className="font-semibold tabular-nums">{formatEur(resteAChargeTotal, true)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{COPY.gainNetMairie}</dt>
              <dd className="font-semibold tabular-nums text-emerald-600">
                {formatEur(gainNetMairieTotal, true)}/an
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{COPY.fondsVert}</dt>
              <dd className="font-semibold tabular-nums">{formatEur(fondsVertPotential, true)}</dd>
            </div>
          </dl>
        </div>

        <PersonaDossierTips personas={personas} />
      </div>

      {/* Colonne droite 70% — MGPE scroll interne */}
      <div className="min-h-0 lg:h-full">
        {mgpe ? (
          <DossierMgpeSection mgpe={mgpe} compact />
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-400">
            Argumentaire MGPE non disponible pour ce territoire.
          </div>
        )}
      </div>
    </div>
  );
}
