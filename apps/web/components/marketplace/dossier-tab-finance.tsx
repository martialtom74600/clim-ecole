'use client';

import { useMemo, useState } from 'react';
import type { MarketplaceMgpeSummary, MarketplacePack } from '@/lib/types';
import type { ClientPersona } from '@/lib/brand';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { COPY, SCORE_GRADES } from '@/lib/copy';
import { formatEur } from '@/lib/format';
import {
  narrativeBudget,
  narrativeGain,
  narrativeRac,
  narrativeRoi,
  narrativeSubventions,
} from '@/lib/narrative-copy';
import { computeFinanceSimulation } from '@/lib/finance-simulator';
import {
  DOSSIER_CONTENT,
  DOSSIER_KPI,
  DOSSIER_SECTION,
  DOSSIER_SECTION_DESC,
  DOSSIER_SECTION_TITLE,
  DOSSIER_STACK,
} from '@/lib/dossier-ui';
import { GlossaryTerm } from '@/components/ui/glossary-term';
import { DossierFundingWaterfall } from '@/components/marketplace/dossier-funding-waterfall';
import { RacSimulator } from '@/components/marketplace/rac-simulator';
import { DossierPitchCard } from '@/components/marketplace/dossier-pitch-card';
import { PersonaDossierTips } from '@/components/marketplace/persona-dossier-tips';
import {
  FinanceScenariosCompare,
  MgpeInteractiveSimulator,
} from '@/components/marketplace/finance-enhancements';
import { CeeTerritoryPanel, EscoMutualizationPanel } from '@/components/marketplace/cee-esco-panels';
import { DossierBlurredPaywallZone } from '@/components/marketplace/dossier-inline-paywall';
import { DossierPaywallCard } from '@/components/marketplace/dossier-paywall-card';
import { cn } from '@/lib/utils';

export function DossierTabFinance({
  pack,
  unlocked,
  soldOut,
  freePreview,
  packCapexTotal,
  subventionRatio,
  resteAChargeTotal,
  gainNetMairieTotal,
  fondsVertPotential,
  roiAnnees,
  mgpe,
  personas,
  territoryName,
}: {
  pack: MarketplacePack;
  unlocked: boolean;
  soldOut?: boolean;
  freePreview?: TerritoryFreePreview;
  packCapexTotal: number;
  subventionRatio: number;
  resteAChargeTotal: number;
  gainNetMairieTotal: number;
  fondsVertPotential: number;
  roiAnnees: number;
  mgpe?: MarketplaceMgpeSummary;
  personas: ClientPersona[];
  territoryName: string;
}) {
  const [subRate, setSubRate] = useState(Math.round(subventionRatio * 100));
  const [dureeAns, setDureeAns] = useState(mgpe?.dureeContratAns || 15);
  const [loyerFactor, setLoyerFactor] = useState(1);

  const sim = useMemo(
    () =>
      computeFinanceSimulation({
        capex: packCapexTotal,
        baseSubventionRatio: subventionRatio,
        subRatePct: subRate,
        baseGainNetMairie: gainNetMairieTotal,
        baseRoiAnnees: roiAnnees,
        mgpe: mgpe
          ? {
              loyerLtEuros: mgpe.loyerLtEuros,
              redevanceFtEuros: mgpe.redevanceFtEuros,
              gainNetContractuelEuros: mgpe.gainNetContractuelEuros,
              dureeContratAns: mgpe.dureeContratAns,
            }
          : undefined,
        loyerFactor,
        dureeAns,
      }),
    [
      packCapexTotal,
      subventionRatio,
      subRate,
      gainNetMairieTotal,
      roiAnnees,
      mgpe,
      loyerFactor,
      dureeAns,
    ],
  );

  const budgetLabel = unlocked
    ? formatEur(packCapexTotal, true)
    : freePreview?.budgetRange ?? pack.budgetRange;
  const racLabel = unlocked ? formatEur(sim.rac, true) : '••••• €';

  const heroStrip = (
    <div className="grid divide-y border border-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">
      <KpiCell
        label="Budget travaux estimé"
        value={budgetLabel}
        hint={
          unlocked
            ? narrativeBudget(packCapexTotal, pack.batimentCount)
            : `Fourchette ${budgetLabel}`
        }
      />
      <KpiCell
        label="Reste à financer (pour la mairie)"
        value={racLabel}
        hint={
          unlocked
            ? narrativeRac(sim.rac, sim.subventionRatio)
            : 'Montant exact après déblocage'
        }
        accent="amber"
        blurred={!unlocked}
      />
      <KpiCell
        label="Économies estimées"
        value={unlocked ? formatEur(sim.gainNet, true) + '/an' : '—'}
        hint={unlocked ? narrativeGain(sim.gainNet) : narrativeRoi(roiAnnees)}
        accent="emerald"
        blurred={!unlocked}
      />
    </div>
  );

  const simulatorBlock = (
    <div className="space-y-8">
      <DossierFundingWaterfall
        capex={packCapexTotal}
        subventionsTotal={sim.subventions}
        subventionRatio={sim.subventionRatio}
        racTotal={sim.rac}
        roiAnnees={sim.roiAnnees}
      />
      <RacSimulator
        capex={packCapexTotal}
        subRatePct={subRate}
        onSubRateChange={setSubRate}
        subventions={sim.subventions}
        rac={sim.rac}
        subventionRatio={sim.subventionRatio}
      />
      <FinanceScenariosCompare
        capex={packCapexTotal}
        subventionsPess={sim.subventionsPess}
        subventionsOpt={sim.subventionsOpt}
        racPess={sim.racPess}
        racOpt={sim.racOpt}
        activeSubRate={subRate}
      />
    </div>
  );

  const mgpeBlock = mgpe ? (
    <div className="space-y-8">
      <MgpeInteractiveSimulator
        loyer={sim.loyer}
        redevance={sim.redevance}
        gainNet={sim.gainContractuel}
        dureeAns={dureeAns}
        loyerFactor={loyerFactor}
        onDureeChange={setDureeAns}
        onLoyerFactorChange={setLoyerFactor}
      />
      <DossierPitchCard
        mgpe={mgpe}
        territoryName={territoryName}
        batimentCount={pack.batimentCount}
        racTotal={sim.rac}
        gainNetMairieTotal={sim.gainNet}
        dureeAns={dureeAns}
      />
    </div>
  ) : (
    <p className="text-sm text-slate-500">
      Montage en{' '}
      <GlossaryTerm term="Montage en tiers-financement">tiers-financement</GlossaryTerm>{' '}
      non disponible pour ce territoire.
    </p>
  );

  return (
    <div className={DOSSIER_CONTENT}>
      <div className={DOSSIER_STACK}>
        {/* Synthèse chiffres — une seule bande, pas de tuiles */}
        <section>
          {unlocked ? heroStrip : (
            <DossierBlurredPaywallZone
              pack={pack}
              soldOut={soldOut}
              title="Débloquez les montants financiers exacts pour 290 €"
              subtitle="Budget, reste à financer et économies — recalculés en temps réel."
            >
              {heroStrip}
            </DossierBlurredPaywallZone>
          )}
          {unlocked && (
            <p className="mt-4 text-sm text-slate-500">
              {narrativeSubventions(sim.subventions, sim.subventionRatio)}
              {' · '}
              {narrativeRoi(sim.roiAnnees)}
            </p>
          )}
        </section>

        {/* Simulateur — flux vertical */}
        <section className={DOSSIER_SECTION}>
          <h2 className={DOSSIER_SECTION_TITLE}>Simulateur de financement</h2>
          <p className={DOSSIER_SECTION_DESC}>
            Ajustez le taux d&apos;aides : le reste à financer, le loyer et le gain net se mettent à jour.
          </p>
          <div className="mt-6">
            {unlocked ? simulatorBlock : (
              <DossierBlurredPaywallZone pack={pack} soldOut={soldOut}>
                {simulatorBlock}
              </DossierBlurredPaywallZone>
            )}
          </div>
        </section>

        {/* Montage & pitch */}
        <section className={DOSSIER_SECTION}>
          <h2 className={DOSSIER_SECTION_TITLE}>Montage & pitch mairie</h2>
          <p className={DOSSIER_SECTION_DESC}>
            Paramètres du contrat et texte prêt à envoyer au maire.
          </p>
          <div className="mt-6">
            {unlocked ? mgpeBlock : (
              <DossierBlurredPaywallZone
                pack={pack}
                soldOut={soldOut}
                title="Pitch prêt-à-l'emploi inclus dans le déblocage"
              >
                {mgpeBlock}
              </DossierBlurredPaywallZone>
            )}
          </div>
        </section>

        {/* Indicateurs */}
        <section className={DOSSIER_SECTION}>
          <h2 className={DOSSIER_SECTION_TITLE}>Ce que la commune y gagne</h2>
          <dl className="mt-6 space-y-5 text-sm">
            <Row
              label={
                <>
                  Aide <GlossaryTerm term="Fonds Vert">Fonds Vert</GlossaryTerm> (prudente)
                </>
              }
              value={
                unlocked
                  ? `Environ ${formatEur(resteAChargeTotal, true)} couverts par les aides de l'État`
                  : freePreview?.subventionLevel ?? pack.subventionLevelLabel
              }
            />
            <Row
              label="Économies annuelles estimées"
              value={unlocked ? narrativeGain(sim.gainNet) : 'Après déblocage'}
              positive={unlocked}
            />
            <Row
              label="Loyer tiers-financement / an"
              value={
                unlocked && sim.loyer > 0
                  ? `${formatEur(sim.loyer, true)} — lié au curseur d'aides`
                  : unlocked
                    ? '—'
                    : 'Après déblocage'
              }
            />
            <Row
              label="Potentiel total d'aides"
              value={
                unlocked
                  ? `Jusqu'à ${formatEur(fondsVertPotential, true)} mobilisables`
                  : 'Après déblocage'
              }
            />
          </dl>
        </section>

        {/* Modules complémentaires — empilés, pas en grille */}
        <section className={DOSSIER_SECTION}>
          <h2 className={DOSSIER_SECTION_TITLE}>Modules territoire</h2>
          <div className="mt-6 space-y-8">
            <EscoMutualizationPanel
              batimentCount={pack.batimentCount}
              packCapexTotal={packCapexTotal}
              isMutualizable={pack.isMutualizable ?? false}
              gainNetMairieTotal={sim.gainNet}
              unlocked={unlocked}
            />
            <CeeTerritoryPanel
              ceeEurosTotal={pack.ceeEurosTotal ?? 0}
              cumacKwhTotal={pack.cumacKwhTotal ?? 0}
              batimentCount={pack.batimentCount}
              unlocked={unlocked}
            />
          </div>
        </section>

        <PersonaDossierTips personas={personas} />

        {/* Freemium : aperçu + paywall en bas de page */}
        {!unlocked && (
          <section className={DOSSIER_SECTION}>
            <h2 className={DOSSIER_SECTION_TITLE}>Aperçu gratuit</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                { label: 'Fourchette de budget', value: freePreview?.budgetRange ?? pack.budgetRange },
                {
                  label: "Niveau d'aides publiques",
                  value: freePreview?.subventionLevel ?? pack.subventionLevelLabel,
                },
                {
                  label: 'Profil énergétique',
                  value: freePreview?.dpeProfile.worstClass ?? '—',
                  hint: freePreview?.dpeProfile.label,
                },
                {
                  label: COPY.scorePriorite,
                  value: `${pack.radarGrade} · ${pack.radarScore}/100`,
                  hint: SCORE_GRADES[pack.radarGrade],
                },
              ].map(({ label, value, hint }) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 border-b border-slate-100 pb-3 last:border-0"
                >
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right">
                    <span className="font-medium text-slate-900">{value}</span>
                    {hint && <span className="mt-0.5 block text-xs text-slate-400">{hint}</span>}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-8">
              <DossierPaywallCard
                pack={pack}
                freePreview={freePreview}
                soldOut={soldOut ?? false}
                embedded
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function KpiCell({
  label,
  value,
  hint,
  accent,
  blurred,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: 'amber' | 'emerald';
  blurred?: boolean;
}) {
  return (
    <div className="px-5 py-6 md:px-6">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={cn(
          DOSSIER_KPI,
          'mt-2 transition-all duration-300',
          accent === 'amber' && 'text-amber-800',
          accent === 'emerald' && 'text-emerald-800',
          blurred && 'blur-sm select-none',
        )}
      >
        {value}
      </p>
      <p className={cn('mt-2 text-sm leading-relaxed text-slate-500', blurred && 'blur-[2px]')}>
        {hint}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  positive,
}: {
  label: React.ReactNode;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className={cn('sm:text-right', positive ? 'text-emerald-700' : 'text-slate-800')}>
        {value}
      </dd>
    </div>
  );
}
