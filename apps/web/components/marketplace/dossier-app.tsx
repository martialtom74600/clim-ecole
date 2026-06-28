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
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [tab, setTab] = useState<DossierTabId>(
    isDossierTabId(tabParam) ? tabParam : 'finance',
  );

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

  const changeTab = useCallback(
    (next: DossierTabId) => {
      setTab(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', next);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-slate-50">
      <DossierAppHeader
        pack={pack}
        unlocked={unlocked}
        communesLabel={communesLabel}
        nomEpci={nomEpci}
        racTotal={racTotal}
        freePreview={freePreview}
      />

      <DossierAppTabs active={tab} onChange={changeTab} />

      <div className="min-h-0 flex-1 overflow-hidden">
        {unlocked ? (
          <>
            {tab === 'finance' && (
              <DossierTabFinance
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
              />
            )}
            {tab === 'prospect' && <DossierTabProspect buildings={buildings} />}
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
