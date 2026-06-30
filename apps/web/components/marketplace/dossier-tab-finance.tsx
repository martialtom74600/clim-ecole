'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { MarketplaceMgpeSummary, MarketplacePack } from '@/lib/types';
import type { ClientPersona } from '@/lib/brand';
import type { TerritoryFreePreview } from '@/lib/freemium';
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
  DOSSIER_KPI_LABEL,
  DOSSIER_SECTION,
  DOSSIER_SECTION_DESC,
  DOSSIER_SECTION_TITLE,
  DOSSIER_STACK,
} from '@/lib/dossier-ui';
import { GlossaryTerm } from '@/components/ui/glossary-term';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Disclosure } from '@/components/ui/disclosure';
import { EASE } from '@/lib/motion';
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
import { DossierNextSteps } from '@/components/marketplace/dossier-next-steps';
import { cn } from '@/lib/utils';

export function DossierTabFinance({
  pack,
  unlocked,
  soldOut,
  freePreview,
  similarPacks,
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
  similarPacks?: MarketplacePack[];
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

  /* Dissolution one-time du paywall : la 1re fois qu'on voit le dossier débloqué,
     les chiffres émergent du flou pendant qu'ils comptent jusqu'à leur valeur. */
  const reduceMotion = useReducedMotion();
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (!unlocked || reduceMotion) return;
    const key = `clim-finance-reveal-${pack.packId}`;
    if (!localStorage.getItem(key)) {
      setCelebrate(true);
      localStorage.setItem(key, '1');
    }
  }, [unlocked, reduceMotion, pack.packId]);

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
    <div className="grid divide-y rounded-xl border border-line bg-surface-sunken shadow-card md:grid-cols-3 md:divide-x md:divide-y-0">
      <KpiCell
        label="Budget travaux estimé"
        value={
          unlocked ? (
            <AnimatedNumber value={packCapexTotal} format={(v) => formatEur(v, true)} />
          ) : (
            budgetLabel
          )
        }
        hint={
          unlocked
            ? narrativeBudget(packCapexTotal, pack.batimentCount)
            : `Fourchette ${budgetLabel}`
        }
      />
      <KpiCell
        label="Reste à financer (pour la mairie)"
        value={
          unlocked ? (
            <AnimatedNumber value={sim.rac} format={(v) => formatEur(v, true)} />
          ) : (
            racLabel
          )
        }
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
        value={
          unlocked ? (
            <AnimatedNumber value={sim.gainNet} format={(v) => `${formatEur(v, true)}/an`} />
          ) : (
            '—'
          )
        }
        hint={unlocked ? narrativeGain(sim.gainNet) : narrativeRoi(roiAnnees)}
        accent="emerald"
        blurred={!unlocked}
      />
    </div>
  );

  /* Essentiel — la décision se prend ici : répartition + curseur d'aides. */
  const essentialSimulator = (
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
    </div>
  );

  const scenariosBlock = (
    <FinanceScenariosCompare
      capex={packCapexTotal}
      subventionsPess={sim.subventionsPess}
      subventionsOpt={sim.subventionsOpt}
      racPess={sim.racPess}
      racOpt={sim.racOpt}
      activeSubRate={subRate}
    />
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
    <p className="text-sm text-ink-muted">
      Montage en{' '}
      <GlossaryTerm term="Montage en tiers-financement">tiers-financement</GlossaryTerm>{' '}
      non disponible pour ce territoire.
    </p>
  );

  const communeGagneBlock = (
    <dl className="space-y-5 text-sm">
      <Row
        label={
          <>
            Aide <GlossaryTerm term="Fonds Vert">Fonds Vert</GlossaryTerm> (prudente)
          </>
        }
        value={`Environ ${formatEur(resteAChargeTotal, true)} couverts par les aides de l'État`}
      />
      <Row label="Économies annuelles estimées" value={narrativeGain(sim.gainNet)} positive />
      <Row
        label="Loyer tiers-financement / an"
        value={
          sim.loyer > 0 ? `${formatEur(sim.loyer, true)} — lié au curseur d'aides` : '—'
        }
      />
      <Row
        label="Potentiel total d'aides"
        value={`Jusqu'à ${formatEur(fondsVertPotential, true)} mobilisables`}
      />
    </dl>
  );

  const escoCeePanels = (
    <div className="space-y-8">
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
  );

  return (
    <div className={DOSSIER_CONTENT}>
      <div className={DOSSIER_STACK}>

        {/* Synthèse chiffres — données libres EN PREMIER, puis les zones bloquées */}
        <section>
          {unlocked ? (
            <motion.div
              initial={celebrate ? { opacity: 0, scale: 0.97, filter: 'blur(10px)' } : false}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, ease: EASE.out }}
            >
              {heroStrip}
            </motion.div>
          ) : (
            <DossierBlurredPaywallZone
              title="Montants exacts après déblocage"
              subtitle="Budget, reste à financer et économies, recalculés en temps réel."
            >
              {heroStrip}
            </DossierBlurredPaywallZone>
          )}
          {unlocked && (
            <p className="mt-4 text-sm text-ink-muted">
              {narrativeSubventions(sim.subventions, sim.subventionRatio)}
              {' · '}
              {narrativeRoi(sim.roiAnnees)}
            </p>
          )}
        </section>

        {/* Simulateur essentiel — la décision se prend ici */}
        <section className={DOSSIER_SECTION}>
          <h2 className={DOSSIER_SECTION_TITLE}>Simulateur de financement</h2>
          <p className={DOSSIER_SECTION_DESC}>
            Ajustez le taux d&apos;aides : le reste à financer se recalcule en temps réel.
          </p>
          <div className="mt-6">
            {unlocked ? essentialSimulator : (
              <DossierBlurredPaywallZone subtitle="Ajustez le taux d'aides après déblocage.">
                {essentialSimulator}
              </DossierBlurredPaywallZone>
            )}
          </div>
        </section>

        {/* Montage avancé & financements — progressive disclosure pour les débloqués */}
        {unlocked ? (
          <section className={DOSSIER_SECTION}>
            <Disclosure
              title="Montage avancé & financements"
              hint="Scénarios d'aides, tiers-financement & pitch mairie, ESCO et CEE"
            >
              <div className="space-y-12">
                <div>
                  <h3 className={DOSSIER_SECTION_TITLE}>Scénarios d&apos;aides</h3>
                  <p className={DOSSIER_SECTION_DESC}>
                    Fourchette prudente / optimiste autour de votre réglage.
                  </p>
                  <div className="mt-6">{scenariosBlock}</div>
                </div>
                <div>
                  <h3 className={DOSSIER_SECTION_TITLE}>Montage & pitch mairie</h3>
                  <p className={DOSSIER_SECTION_DESC}>
                    Paramètres du contrat et texte prêt à envoyer au maire.
                  </p>
                  <div className="mt-6">{mgpeBlock}</div>
                </div>
                <div>
                  <h3 className={DOSSIER_SECTION_TITLE}>Ce que la commune y gagne</h3>
                  <div className="mt-6">{communeGagneBlock}</div>
                </div>
                <div>
                  <h3 className={DOSSIER_SECTION_TITLE}>Financements additionnels</h3>
                  <p className={DOSSIER_SECTION_DESC}>
                    Tiers-financement ESCO et Certificats d&apos;Économies d&apos;Énergie.
                  </p>
                  <div className="mt-6">{escoCeePanels}</div>
                </div>
              </div>
            </Disclosure>
          </section>
        ) : (
          <>
            {/* Montage & pitch — teaser flouté */}
            <section className={DOSSIER_SECTION}>
              <h2 className={DOSSIER_SECTION_TITLE}>Montage & pitch mairie</h2>
              <p className={DOSSIER_SECTION_DESC}>
                Paramètres du contrat et texte prêt à envoyer au maire.
              </p>
              <div className="mt-6">
                <DossierBlurredPaywallZone
                  title="Pitch prêt-à-l'emploi inclus"
                  subtitle="Texte à envoyer au maire, généré après déblocage."
                >
                  {mgpeBlock}
                </DossierBlurredPaywallZone>
              </div>
            </section>

            {/* Financements additionnels — teaser */}
            <section className={DOSSIER_SECTION}>
              <h2 className={DOSSIER_SECTION_TITLE}>Financements additionnels</h2>
              <p className={DOSSIER_SECTION_DESC}>
                Tiers-financement ESCO et Certificats d&apos;Économies d&apos;Énergie mobilisables sur ce territoire.
              </p>
              <div className="mt-6">{escoCeePanels}</div>
            </section>
          </>
        )}

        <PersonaDossierTips personas={personas} />

        {/* CTA unique en bas de page — un seul point de conversion */}
        {!unlocked && (
          <section className={cn(DOSSIER_SECTION, 'space-y-4')}>
            <DossierPaywallCard
              pack={pack}
              freePreview={freePreview}
              soldOut={soldOut ?? false}
              embedded
            />
            {/* Filet anti cul-de-sac : suivre, être alerté, ou rebondir ailleurs */}
            <DossierNextSteps
              pack={pack}
              similarPacks={similarPacks}
              soldOut={soldOut ?? false}
            />
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
  value: React.ReactNode;
  hint: string;
  accent?: 'amber' | 'emerald';
  blurred?: boolean;
}) {
  return (
    <div
      className={cn(
        'px-6 py-7 transition-all duration-300 ease-out md:px-8',
        accent === 'amber' && 'border-l-2 border-warning',
        accent === 'emerald' && 'border-l-2 border-positive',
      )}
    >
      {/* Label — discret, uppercase, contraste maximal avec la donnée massive */}
      <p className={DOSSIER_KPI_LABEL}>{label}</p>
      <p
        className={cn(
          DOSSIER_KPI,
          'mt-2 transition-all duration-300 ease-out',
          accent === 'amber' && 'text-warning-text',
          accent === 'emerald' && 'text-positive-text',
          blurred && 'blur-[3px] select-none',
        )}
      >
        {value}
      </p>
      <p className={cn('mt-2 text-sm leading-relaxed text-ink-muted', blurred && 'blur-[3px]')}>
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
    <div className="flex flex-col gap-1 rounded-lg px-3 py-2 transition-colors duration-200 ease-out hover:bg-surface-sunken sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={cn('font-medium sm:text-right', positive ? 'text-positive-text' : 'text-ink-soft')}>
        {value}
      </dd>
    </div>
  );
}
