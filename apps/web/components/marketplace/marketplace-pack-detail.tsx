import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { MarketplacePackDetail } from '@/lib/types';
import { COPY } from '@/lib/copy';
import { DOSSIER_LOCKED_GUIDE } from '@/lib/site-guide';
import { PaywallOverlay } from '@/components/ui/paywall-overlay';
import { RacSimulator } from '@/components/marketplace/rac-simulator';
import { CheckoutButton } from '@/components/marketplace/checkout-button';
import { PostPurchaseChecklist } from '@/components/marketplace/post-purchase-checklist';
import { TerritoryFreePreviewPanel } from '@/components/marketplace/territory-free-preview';
import { DossierMgpeSection } from '@/components/marketplace/dossier-mgpe-section';
import { DossierArtisansSection } from '@/components/marketplace/dossier-artisans-section';
import { GuidedSteps } from '@/components/marketplace/guided-steps';
import { DossierSectionNav } from '@/components/marketplace/dossier-section-nav';
import { PersonaDossierTips } from '@/components/marketplace/persona-dossier-tips';
import { PaywallIncludes } from '@/components/marketplace/paywall-includes';
import { DossierCommandHeader } from '@/components/marketplace/dossier-command-header';
import { DossierFinancePanel } from '@/components/marketplace/dossier-finance-panel';
import { DossierProspectSplit } from '@/components/marketplace/dossier-prospect-split';
import { DossierSchoolCards } from '@/components/marketplace/dossier-school-cards';
import { DossierSection } from '@/components/marketplace/dossier-section';
import { DossierTrustFooter } from '@/components/marketplace/dossier-trust-footer';
import { PersonaExplainPanel } from '@/components/marketplace/persona-explain';

export function MarketplacePackDetailView({ data }: { data: MarketplacePackDetail }) {
  const {
    pack,
    buildings,
    unlocked,
    freePreview,
    personaExplanations,
    radarFactors,
    communesLabel,
    nomEpci,
    dataLoadedAt,
    scoreClosingMax,
    mgpe,
    resteAChargeAfterSubsTotal,
  } = data;

  const racTotal = resteAChargeAfterSubsTotal ?? pack.packCapexTotal - pack.subventionsTotal;
  const dossierSoldOut = pack.soldOut && !unlocked;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Top bar */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 md:px-8 md:py-6">
          <Link
            href="/explorer"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {COPY.backToExplorer}
          </Link>

          <DossierCommandHeader
            pack={pack}
            unlocked={unlocked}
            communesLabel={communesLabel}
            nomEpci={nomEpci}
            racTotal={racTotal}
            scoreClosingMax={scoreClosingMax}
            radarFactors={radarFactors}
          />
        </div>
      </div>

      {/* Locked state */}
      {!unlocked && (
        <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 md:px-8">
          <GuidedSteps title="Avant d'acheter" steps={DOSSIER_LOCKED_GUIDE} />

          {freePreview && (
            <TerritoryFreePreviewPanel
              preview={freePreview}
              batimentCount={pack.batimentCount}
              department={pack.department}
              radarGrade={pack.radarGrade}
            />
          )}

          <PaywallIncludes />

          <DossierSection
            id="prospecter"
            number={1}
            title="Aperçu des écoles"
            description="Liste floutée — débloquez pour accéder aux contacts et montants exacts."
          >
            <PaywallOverlay
              buildingCount={buildings.length}
              capex={freePreview?.budgetRange}
              packId={pack.packId}
              soldOut={dossierSoldOut}
              slotsRemaining={pack.slotsRemaining}
            >
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                <DossierSchoolCards buildings={buildings} unlocked={false} />
              </div>
            </PaywallOverlay>
          </DossierSection>

          <div className="flex flex-col gap-3 sm:flex-row">
            <CheckoutButton
              plan="dossier"
              packId={pack.packId}
              disabled={dossierSoldOut}
              className="btn-primary flex-1 py-4"
            >
              {dossierSoldOut ? COPY.soldOut : 'Débloquer ce territoire — 290 € HT'}
            </CheckoutButton>
            <CheckoutButton plan="pro" className="btn-secondary flex-1 py-4">
              {COPY.subscription} — 990 € HT/mois
            </CheckoutButton>
          </div>
        </div>
      )}

      {/* Unlocked state */}
      {unlocked && (
        <>
          <DossierSectionNav />

          <div className="mx-auto max-w-7xl space-y-14 px-5 py-8 md:px-8 md:py-10">
            {/* 1 — Prospecter (primary) */}
            <DossierSection
              id="prospecter"
              number={1}
              title="Prospecter"
              description="Écoles triées par score closing — carte synchronisée, contacts en un clic."
            >
              <DossierProspectSplit buildings={buildings} unlocked={unlocked} />
              <div className="mt-6">
                <DossierArtisansSection buildings={buildings} />
              </div>
            </DossierSection>

            {/* 2 — Financer */}
            <DossierSection
              id="financer"
              number={2}
              title="Financer"
              description="Montants, répartition subventions/RAC et simulateur de sensibilité."
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(280px,2fr)] lg:items-start">
                <DossierFinancePanel
                  packCapexTotal={pack.packCapexTotal}
                  subventionsTotal={pack.subventionsTotal}
                  subventionRatio={pack.subventionRatio}
                  racTotal={racTotal}
                  resteAChargeTotal={pack.resteAChargeTotal}
                  gainNetMairieTotal={pack.gainNetMairieTotal}
                  fondsVertPotential={pack.fondsVertPotential}
                  roiAnnees={pack.roiAnnees}
                />
                <RacSimulator capex={pack.packCapexTotal} baseSubventionRatio={pack.subventionRatio} />
              </div>
            </DossierSection>

            {/* 3 — Argumentaire / Closing */}
            <DossierSection
              id="closer"
              number={3}
              title="Argumentaire"
              description="Pitch MGPE-PD, cadre Loi ELAN et conseils selon votre métier."
            >
              <div className="space-y-6">
                {mgpe && <DossierMgpeSection mgpe={mgpe} />}
                <PersonaDossierTips personas={pack.personas} />
                {personaExplanations && (
                  <PersonaExplainPanel explanations={personaExplanations} />
                )}
              </div>
            </DossierSection>

            {/* 4 — Exporter */}
            <DossierSection
              id="exporter"
              number={4}
              title="Exporter & suivre"
              description="Téléchargez vos livrables et avancez le statut dans votre pipeline."
            >
              <PostPurchaseChecklist packId={pack.packId} />
            </DossierSection>
          </div>

          <DossierTrustFooter
            dataLoadedAt={dataLoadedAt}
            nomEpci={nomEpci}
            communesLabel={communesLabel}
          />
        </>
      )}
    </div>
  );
}
