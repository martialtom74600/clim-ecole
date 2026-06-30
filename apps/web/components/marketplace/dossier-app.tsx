'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  MarketplaceBuilding,
  MarketplaceMgpeSummary,
  MarketplacePack,
} from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { PRICING, priceLabel } from '@/lib/pricing';
import {
  DOSSIER_CONTENT,
  DOSSIER_PAGE,
  DOSSIER_STICKY,
  DOSSIER_STICKY_SCROLLED,
} from '@/lib/dossier-ui';
import { DossierAppHeader } from '@/components/marketplace/dossier-app-header';
import {
  DossierSectionNav,
  legacyTabToSection,
  scrollToDossierSection,
  useDossierSectionSpy,
  type DossierSectionId,
} from '@/components/marketplace/dossier-app-tabs';
import { DossierVerdictSection } from '@/components/marketplace/dossier-verdict-section';
import { DossierTabFinance } from '@/components/marketplace/dossier-tab-finance';
import { DossierTabProspect } from '@/components/marketplace/dossier-tab-prospect';
import { DossierTabExports } from '@/components/marketplace/dossier-tab-exports';
import { DossierFooterMeta } from '@/components/marketplace/dossier-footer-meta';
import { DossierPaywallCard } from '@/components/marketplace/dossier-paywall-card';
import { DossierNextSteps } from '@/components/marketplace/dossier-next-steps';
import { PostPurchaseChecklist } from '@/components/marketplace/post-purchase-checklist';
import { PresentationModeToggle } from '@/components/marketplace/dossier-client-tools';
import { cn } from '@/lib/utils';

export function DossierApp({
  pack,
  buildings,
  unlocked,
  isDemo = false,
  communesLabel,
  nomEpci,
  mgpe,
  freePreview,
  similarPacks,
  soldOut = false,
  dataLoadedAt,
}: {
  pack: MarketplacePack;
  buildings: MarketplaceBuilding[];
  unlocked: boolean;
  isDemo?: boolean;
  communesLabel?: string;
  nomEpci?: string;
  mgpe?: MarketplaceMgpeSummary;
  freePreview?: TerritoryFreePreview;
  similarPacks?: MarketplacePack[];
  soldOut?: boolean;
  dataLoadedAt?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const sectionParam = searchParams.get('section');
  const presentParam = searchParams.get('present') === '1';

  const { active: activeSection, navigate } = useDossierSectionSpy('verdict');
  const [presentation, setPresentation] = useState(presentParam);
  const [showChecklist, setShowChecklist] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const territoryName = communesLabel ?? nomEpci ?? pack.publicName;

  /* Scroll initial depuis ?tab= ou ?section= (rétrocompat) */
  useEffect(() => {
    const target =
      legacyTabToSection(sectionParam) ??
      legacyTabToSection(tabParam);
    if (target) {
      requestAnimationFrame(() => scrollToDossierSection(target));
    }
  }, [tabParam, sectionParam]);

  useEffect(() => {
    if (unlocked && !isDemo) {
      const key = `clim-checklist-${pack.packId}`;
      if (!localStorage.getItem(key)) {
        setShowChecklist(true);
        localStorage.setItem(key, '1');
      }
    }
  }, [unlocked, isDemo, pack.packId]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const changeSection = useCallback(
    (next: DossierSectionId) => {
      navigate(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set('section', next);
      params.delete('tab');
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, navigate],
  );

  const content = (
    <>
      <DossierVerdictSection
        pack={pack}
        freePreview={freePreview}
        unlocked={unlocked}
        packCapexTotal={pack.packCapexTotal}
        subventionRatio={pack.subventionRatio}
      />

      <DossierTabProspect
        buildings={buildings}
        pack={pack}
        unlocked={unlocked}
        soldOut={soldOut}
        freePreview={freePreview}
        territoryName={territoryName}
      />

      <DossierTabFinance
        pack={pack}
        unlocked={unlocked}
        freePreview={freePreview}
        packCapexTotal={pack.packCapexTotal}
        subventionRatio={pack.subventionRatio}
        resteAChargeTotal={pack.resteAChargeTotal}
        gainNetMairieTotal={pack.gainNetMairieTotal}
        fondsVertPotential={pack.fondsVertPotential}
        roiAnnees={pack.roiAnnees}
        mgpe={mgpe}
        personas={pack.personas}
        territoryName={territoryName}
      />

      <DossierTabExports
        packId={pack.packId}
        pack={pack}
        unlocked={unlocked}
        soldOut={soldOut}
        freePreview={freePreview}
        similarPacks={similarPacks}
      />

      {!unlocked && (
        <div className={cn(DOSSIER_CONTENT, 'space-y-4 pb-12')}>
          <DossierPaywallCard
            pack={pack}
            freePreview={freePreview}
            soldOut={soldOut}
            embedded
          />
          <DossierNextSteps
            pack={pack}
            similarPacks={similarPacks}
            soldOut={soldOut}
          />
        </div>
      )}

      <DossierFooterMeta packId={pack.packId} dataLoadedAt={dataLoadedAt} />
    </>
  );

  const stickyBar = (
    <div className={cn(DOSSIER_STICKY, scrolled && DOSSIER_STICKY_SCROLLED)}>
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <DossierAppHeader
          pack={pack}
          unlocked={unlocked}
          communesLabel={communesLabel}
          nomEpci={nomEpci}
          soldOut={soldOut}
        />
        <div className="flex items-center justify-between">
          <DossierSectionNav active={activeSection} onChange={changeSection} />
          {unlocked && (
            <PresentationModeToggle active={presentation} onChange={setPresentation} />
          )}
        </div>
      </div>
    </div>
  );

  if (presentation) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-surface-sunken">
        <div className="shrink-0 border-b border-line/60 bg-white/80 px-5 py-2 backdrop-blur-xl md:px-8">
          <div className="flex items-center justify-between">
            <DossierSectionNav active={activeSection} onChange={changeSection} />
            <PresentationModeToggle active={presentation} onChange={setPresentation} />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
      </div>
    );
  }

  return (
    <div className={DOSSIER_PAGE}>
      {isDemo && <DemoBanner />}
      {stickyBar}

      {unlocked && showChecklist && (
        <div className="border-b border-line bg-surface-sunken">
          <div className={DOSSIER_CONTENT}>
            <PostPurchaseChecklist
              packId={pack.packId}
              onDismiss={() => setShowChecklist(false)}
            />
          </div>
        </div>
      )}

      {content}
    </div>
  );
}

function DemoBanner() {
  return (
    <div className="border-b border-ink/10 bg-ink text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-3 md:flex-row md:items-center md:justify-between md:px-8">
        <p className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-white/80" strokeWidth={1.5} />
          <span>
            <strong className="font-semibold">Démonstration</strong>
            <span className="text-white/70">
              {' '}
              — dossier réel entièrement débloqué. Votre territoire dès {priceLabel(PRICING.dossier)} HT.
            </span>
          </span>
        </p>
        <Link
          href="/explorer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink transition-transform hover:scale-[1.02] active:scale-95"
        >
          Choisir mon territoire
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
