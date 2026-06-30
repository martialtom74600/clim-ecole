'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  MarketplaceBuilding,
  MarketplaceMgpeSummary,
  MarketplacePack,
} from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import {
  DOSSIER_CONTENT,
  DOSSIER_PAGE,
  DOSSIER_STICKY,
  DOSSIER_STICKY_SCROLLED,
} from '@/lib/dossier-ui';
import { DossierAppHeader } from '@/components/marketplace/dossier-app-header';
import {
  DossierAppTabs,
  isDossierTabId,
  type DossierTabId,
} from '@/components/marketplace/dossier-app-tabs';
import { DossierTabFinance } from '@/components/marketplace/dossier-tab-finance';
import { DossierTabProspect } from '@/components/marketplace/dossier-tab-prospect';
import { DossierTabExports } from '@/components/marketplace/dossier-tab-exports';
import { PostPurchaseChecklist } from '@/components/marketplace/post-purchase-checklist';
import { PresentationModeToggle } from '@/components/marketplace/dossier-client-tools';
import { tabContent } from '@/lib/motion';
import { cn } from '@/lib/utils';

const TAB_ORDER: DossierTabId[] = ['finance', 'prospect', 'exports'];

export function DossierApp({
  pack,
  buildings,
  unlocked,
  communesLabel,
  nomEpci,
  mgpe,
  freePreview,
  soldOut = false,
  dataLoadedAt,
}: {
  pack: MarketplacePack;
  buildings: MarketplaceBuilding[];
  unlocked: boolean;
  communesLabel?: string;
  nomEpci?: string;
  mgpe?: MarketplaceMgpeSummary;
  freePreview?: TerritoryFreePreview;
  soldOut?: boolean;
  dataLoadedAt?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const presentParam = searchParams.get('present') === '1';

  const [tab, setTab] = useState<DossierTabId>(
    isDossierTabId(tabParam) ? tabParam : 'finance',
  );
  const [direction, setDirection] = useState(0);
  const [presentation, setPresentation] = useState(presentParam);
  const [showChecklist, setShowChecklist] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const territoryName = communesLabel ?? nomEpci ?? pack.publicName;

  /* Ref pour calculer la direction du changement d'onglet sans dépendance périmée */
  const tabRef = useRef(tab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  const goToTab = useCallback((next: DossierTabId) => {
    setDirection(TAB_ORDER.indexOf(next) - TAB_ORDER.indexOf(tabRef.current));
    setTab(next);
  }, []);

  useEffect(() => {
    if (isDossierTabId(tabParam) && tabParam !== tabRef.current) {
      goToTab(tabParam);
    }
  }, [tabParam, goToTab]);

  useEffect(() => {
    if (unlocked) {
      const key = `clim-checklist-${pack.packId}`;
      if (!localStorage.getItem(key)) {
        setShowChecklist(true);
        localStorage.setItem(key, '1');
      }
    }
  }, [unlocked, pack.packId]);

  /* Shadow sur le sticky uniquement après le premier pixel de scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const changeTab = useCallback(
    (next: DossierTabId) => {
      goToTab(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', next);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, goToTab],
  );

  const panels = (
    <>
      {tab === 'finance' && (
        <DossierTabFinance
          pack={pack}
          unlocked={unlocked}
          soldOut={soldOut}
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
      )}
      {tab === 'prospect' && (
        <DossierTabProspect
          buildings={buildings}
          pack={pack}
          unlocked={unlocked}
          soldOut={soldOut}
          freePreview={freePreview}
          territoryName={territoryName}
        />
      )}
      {tab === 'exports' && (
        <DossierTabExports
          packId={pack.packId}
          pack={pack}
          unlocked={unlocked}
          soldOut={soldOut}
          freePreview={freePreview}
        />
      )}
    </>
  );

  /* Crossfade directionnel entre onglets — sens piloté par `direction`. */
  const animatedPanels = (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
        key={tab}
        custom={direction}
        variants={tabContent}
        initial="enter"
        animate="center"
        exit="exit"
      >
        {panels}
      </motion.div>
    </AnimatePresence>
  );

  if (presentation) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-surface-sunken">
        <div className="flex shrink-0 items-center justify-between border-b border-line/60 bg-white/80 px-5 py-2 backdrop-blur-xl md:px-8">
          <DossierAppTabs active={tab} onChange={changeTab} />
          <PresentationModeToggle active={presentation} onChange={setPresentation} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {animatedPanels}
        </div>
      </div>
    );
  }

  return (
    <div className={DOSSIER_PAGE}>
      {/* Sticky — glassmorphism + shadow conditionnelle au scroll */}
      <div className={cn(DOSSIER_STICKY, scrolled && DOSSIER_STICKY_SCROLLED)}>
        <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
          <DossierAppHeader
            pack={pack}
            unlocked={unlocked}
            communesLabel={communesLabel}
            nomEpci={nomEpci}
            dataLoadedAt={dataLoadedAt}
          />
          <div className="flex items-center justify-between">
            <DossierAppTabs active={tab} onChange={changeTab} />
            {unlocked && (
              <PresentationModeToggle active={presentation} onChange={setPresentation} />
            )}
          </div>
        </div>
      </div>

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

      {/* Un seul <main> dans toute la page — le layout (saas)/layout.tsx en contient déjà un */}
      <div>{animatedPanels}</div>
    </div>
  );
}
