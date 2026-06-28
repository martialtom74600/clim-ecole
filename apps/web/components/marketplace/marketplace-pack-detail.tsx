import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { MarketplacePackDetail } from '@/lib/types';
import { DossierApp } from '@/components/marketplace/dossier-app';

export function MarketplacePackDetailView({ data }: { data: MarketplacePackDetail }) {
  const {
    pack,
    buildings,
    unlocked,
    freePreview,
    communesLabel,
    nomEpci,
    mgpe,
    resteAChargeAfterSubsTotal,
    dataLoadedAt,
  } = data;

  const racTotal = resteAChargeAfterSubsTotal ?? pack.packCapexTotal - pack.subventionsTotal;
  const soldOut = pack.soldOut && !unlocked;

  return (
    <div className="overflow-hidden">
      <Suspense fallback={<DossierAppLoading />}>
        <DossierApp
          pack={pack}
          buildings={buildings}
          unlocked={unlocked}
          racTotal={racTotal}
          communesLabel={communesLabel}
          nomEpci={nomEpci}
          mgpe={mgpe}
          freePreview={freePreview}
          soldOut={soldOut}
          dataLoadedAt={dataLoadedAt}
        />
      </Suspense>
    </div>
  );
}

function DossierAppLoading() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center bg-slate-50">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  );
}
