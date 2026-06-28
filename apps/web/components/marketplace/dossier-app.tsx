'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  MarketplaceBuilding,
  MarketplaceMgpeSummary,
  MarketplacePack,
} from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { DossierAppHeader } from '@/components/marketplace/dossier-app-header';
import {
  DossierAppTabs,
  isDossierTabId,
  type DossierTabId,
} from '@/components/marketplace/dossier-app-tabs';
import { DossierTabFinance } from '@/components/marketplace/dossier-tab-finance';
import { DossierTabProspect } from '@/components/marketplace/dossier-tab-prospect';
import { DossierTabExports } from '@/components/marketplace/dossier-tab-exports';
import {
  DossierTabExportsLocked,
  DossierTabFinanceLocked,
  DossierTabProspectLocked,
} from '@/components/marketplace/dossier-tab-locked';
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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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

  const shellClass = presentation
    ? 'fixed inset-0 z-[200] flex flex-col overflow-hidden bg-surface-sunken'
    : 'flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-surface-sunken';

  return (
    <div className={shellClass}>
      {!presentation && (
        <DossierAppHeader
          pack={pack}
          unlocked={unlocked}
          communesLabel={communesLabel}
          nomEpci={nomEpci}
          racTotal={racTotal}
          freePreview={freePreview}
          dataLoadedAt={dataLoadedAt}
        />
      )}

      <div className="flex shrink-0 items-center justify-between border-b border-line bg-white px-4 py-1">
        <DossierAppTabs active={tab} onChange={changeTab} />
        {unlocked && (
          <PresentationModeToggle active={presentation} onChange={setPresentation} />
        )}
      </div>

      {unlocked && showChecklist && (
        <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-line bg-surface-sunken p-3">
          <PostPurchaseChecklist
            packId={pack.packId}
            onDismiss={() => setShowChecklist(false)}
          />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        {unlocked ? (
          <>
            {tab === 'finance' && (
              <DossierTabFinance
                pack={pack}
                packCapexTotal={pack.packCapexTotal}
                subventionsTotal={pack.subventionsTotal}
                subventionRatio={pack.subventionRatio}
                racTotal={racTotal}
                resteAChargeTotal={pack.resteAChargeTotal}
                gainNetMairieTotal={pack.gainNetMairieTotal}
                fondsVertPotential={pack.fondsVertPotential}
                roiAnnees={pack.roiAnnees}
                capex={pack.packCapexTotal}
                baseSubventionRatio={pack.subventionRatio}
                mgpe={mgpe}
                personas={pack.personas}
                territoryName={communesLabel ?? nomEpci ?? pack.publicName}
              />
            )}
            {tab === 'prospect' && (
              <DossierTabProspect
                buildings={buildings}
                pack={pack}
                territoryName={communesLabel ?? nomEpci ?? pack.publicName}
              />
            )}
            {tab === 'exports' && <DossierTabExports packId={pack.packId} />}
          </>
        ) : (
          <>
            {tab === 'finance' && (
              <DossierTabFinanceLocked pack={pack} freePreview={freePreview} soldOut={soldOut} />
            )}
            {tab === 'prospect' && (
              <DossierTabProspectLocked buildings={buildings} freePreview={freePreview} />
            )}
            {tab === 'exports' && (
              <DossierTabExportsLocked pack={pack} freePreview={freePreview} soldOut={soldOut} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
