'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  MarketplaceBuilding,
  MarketplaceMgpeSummary,
  MarketplacePack,
} from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { DOSSIER_PAGE, DOSSIER_STICKY } from '@/lib/dossier-ui';
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

export function DossierApp({
  pack,
  buildings,
  unlocked,
  racTotal,
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
  racTotal: number;
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
  const [presentation, setPresentation] = useState(presentParam);
  const [showChecklist, setShowChecklist] = useState(false);

  const territoryName = communesLabel ?? nomEpci ?? pack.publicName;

  useEffect(() => {
    if (isDossierTabId(tabParam) && tabParam !== tab) {
      setTab(tabParam);
    }
  }, [tabParam, tab]);

  useEffect(() => {
    if (unlocked) {
      const key = `clim-checklist-${pack.packId}`;
      if (!localStorage.getItem(key)) {
        setShowChecklist(true);
        localStorage.setItem(key, '1');
      }
    }
  }, [unlocked, pack.packId]);

  const changeTab = useCallback(
    (next: DossierTabId) => {
      setTab(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', next);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  if (presentation) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-slate-50">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
          <DossierAppTabs active={tab} onChange={changeTab} />
          <PresentationModeToggle active={presentation} onChange={setPresentation} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
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
        </div>
      </div>
    );
  }

  return (
    <div className={DOSSIER_PAGE}>
      <div className={DOSSIER_STICKY}>
        <DossierAppHeader
          pack={pack}
          unlocked={unlocked}
          communesLabel={communesLabel}
          nomEpci={nomEpci}
          dataLoadedAt={dataLoadedAt}
        />
        <div className="flex items-center justify-between px-4 pb-0">
          <DossierAppTabs active={tab} onChange={changeTab} />
          {unlocked && (
            <PresentationModeToggle active={presentation} onChange={setPresentation} />
          )}
        </div>
      </div>

      {unlocked && showChecklist && (
        <div className="border-b border-slate-200 bg-white/60 px-6 py-4 md:px-10">
          <div className="mx-auto max-w-7xl">
            <PostPurchaseChecklist
              packId={pack.packId}
              onDismiss={() => setShowChecklist(false)}
            />
          </div>
        </div>
      )}

      <main>
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
      </main>
    </div>
  );
}
