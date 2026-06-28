'use client';

import type { MarketplaceMgpeSummary } from '@/lib/types';
import type { ClientPersona } from '@/lib/brand';
import { COPY } from '@/lib/copy';
import { formatEur } from '@/lib/format';
import { DossierFundingWaterfall } from '@/components/marketplace/dossier-funding-waterfall';
import { DossierMoneyShot } from '@/components/marketplace/dossier-money-shot';
import { RacSimulator } from '@/components/marketplace/rac-simulator';
import { DossierMgpeSection } from '@/components/marketplace/dossier-mgpe-section';
import { PersonaDossierTips } from '@/components/marketplace/persona-dossier-tips';
import {
  FinanceScenariosCompare,
  MgpeInteractiveSimulator,
} from '@/components/marketplace/finance-enhancements';
import { CeeTerritoryPanel, EscoMutualizationPanel } from '@/components/marketplace/cee-esco-panels';
import type { MarketplacePack } from '@/lib/types';

export function DossierTabFinance({
  pack,
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
  territoryName,
}: {
  pack: MarketplacePack;
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
  territoryName: string;
}) {
  const subventionsPess = subventionsTotal * 0.85;
  const subventionsOpt = subventionsTotal * 1.1;
  const racPess = Math.max(0, capex - subventionsPess);
  const racOpt = Math.max(0, capex - subventionsOpt);

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-surface-sunken">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 md:p-5">
        <DossierMoneyShot
          capex={packCapexTotal}
          subventionsTotal={subventionsTotal}
          subventionRatio={subventionRatio}
          racTotal={racTotal}
          gainNetMairieTotal={gainNetMairieTotal}
          roiAnnees={roiAnnees}
          batimentCount={pack.batimentCount}
          territoryName={territoryName}
          mgpe={mgpe}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr]">
          <div className="flex flex-col gap-4">
            <DossierFundingWaterfall
              capex={packCapexTotal}
              subventionsTotal={subventionsTotal}
              subventionRatio={subventionRatio}
              racTotal={racTotal}
              roiAnnees={roiAnnees}
            />
            <RacSimulator capex={capex} baseSubventionRatio={baseSubventionRatio} embedded />
            <FinanceScenariosCompare
              capex={capex}
              subventionsPess={subventionsPess}
              subventionsOpt={subventionsOpt}
              racPess={racPess}
              racOpt={racOpt}
            />

            <div className="rounded-xl border border-line bg-white p-4 text-xs shadow-card">
              <p className="text-sm font-semibold text-ink">Indicateurs complémentaires</p>
              <dl className="mt-2.5 space-y-2">
                <IndicatorRow label={COPY.partFondsVert} value={formatEur(resteAChargeTotal, true)} />
                <IndicatorRow
                  label={COPY.gainNetMairie}
                  value={`${formatEur(gainNetMairieTotal, true)}/an`}
                  tone="positive"
                />
                <IndicatorRow label={COPY.fondsVert} value={formatEur(fondsVertPotential, true)} />
              </dl>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {mgpe && <MgpeInteractiveSimulator base={mgpe} />}
            {mgpe ? (
              <DossierMgpeSection mgpe={mgpe} compact />
            ) : (
              <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-line bg-white p-4 text-xs text-ink-subtle">
                Argumentaire MGPE non disponible pour ce territoire.
              </div>
            )}
          </div>
        </div>

        {/* Modules métier */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EscoMutualizationPanel
            batimentCount={pack.batimentCount}
            packCapexTotal={packCapexTotal}
            isMutualizable={pack.isMutualizable ?? false}
            gainNetMairieTotal={gainNetMairieTotal}
            unlocked
          />
          <CeeTerritoryPanel
            ceeEurosTotal={pack.ceeEurosTotal ?? 0}
            cumacKwhTotal={pack.cumacKwhTotal ?? 0}
            batimentCount={pack.batimentCount}
            unlocked
          />
        </div>

        <PersonaDossierTips personas={personas} />
      </div>
    </div>
  );
}

function IndicatorRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'positive';
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd
        className={
          tone === 'positive'
            ? 'font-mono font-semibold tabular-nums text-positive-text'
            : 'font-mono font-semibold tabular-nums text-ink'
        }
      >
        {value}
      </dd>
    </div>
  );
}
