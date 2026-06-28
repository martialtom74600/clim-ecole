'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { MarketplaceBuilding, MarketplaceMgpeSummary, MarketplacePack } from '@/lib/types';
import { DossierAppHeader } from '@/components/marketplace/dossier-app-header';
import {
  DossierAppTabs,
  isDossierTabId,
  type DossierTabId,
} from '@/components/marketplace/dossier-app-tabs';
import { DossierTabFinance } from '@/components/marketplace/dossier-tab-finance';
import { DossierTabProspect } from '@/components/marketplace/dossier-tab-prospect';
import { DossierTabExports } from '@/components/marketplace/dossier-tab-exports';

export function DossierUnlockedApp({
  pack,
  buildings,
  racTotal,
  communesLabel,
  nomEpci,
  mgpe,
}: {
  pack: MarketplacePack;
  buildings: MarketplaceBuilding[];
  racTotal: number;
  communesLabel?: string;
  nomEpci?: string;
  mgpe?: MarketplaceMgpeSummary;
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
        communesLabel={communesLabel}
        nomEpci={nomEpci}
        racTotal={racTotal}
      />

      <DossierAppTabs active={tab} onChange={changeTab} />

      <div className="min-h-0 flex-1 overflow-hidden">
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
      </div>
    </div>
  );
}
