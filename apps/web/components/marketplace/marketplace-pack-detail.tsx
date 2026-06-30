import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { MarketplacePackDetail } from '@/lib/types';
import { DossierApp } from '@/components/marketplace/dossier-app';

export function MarketplacePackDetailView({
  data,
  isDemo = false,
}: {
  data: MarketplacePackDetail;
  isDemo?: boolean;
}) {
  const {
    pack,
    buildings,
    unlocked,
    freePreview,
    communesLabel,
    nomEpci,
    mgpe,
    dataLoadedAt,
    similarPacks,
    radarFactors,
  } = data;

  const soldOut = pack.soldOut && !unlocked;

  return (
    <Suspense fallback={<DossierAppLoading />}>
      <DossierApp
        pack={pack}
        buildings={buildings}
        unlocked={unlocked}
        isDemo={isDemo}
        communesLabel={communesLabel}
        nomEpci={nomEpci}
        mgpe={mgpe}
        freePreview={freePreview}
        similarPacks={similarPacks}
        soldOut={soldOut}
        dataLoadedAt={dataLoadedAt}
        radarFactors={radarFactors}
      />
    </Suspense>
  );
}

function DossierAppLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-surface-sunken">
      <Loader2 className="h-6 w-6 animate-spin text-ink-subtle" />
    </div>
  );
}
