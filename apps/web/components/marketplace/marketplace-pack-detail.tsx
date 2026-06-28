import { Suspense } from 'react';
import type { MarketplacePackDetail } from '@/lib/types';
import { COPY } from '@/lib/copy';
import { DOSSIER_LOCKED_GUIDE } from '@/lib/site-guide';
import { PaywallOverlay } from '@/components/ui/paywall-overlay';
import { CheckoutButton } from '@/components/marketplace/checkout-button';
import { TerritoryFreePreviewPanel } from '@/components/marketplace/territory-free-preview';
import { GuidedSteps } from '@/components/marketplace/guided-steps';
import { PaywallIncludes } from '@/components/marketplace/paywall-includes';
import { DossierLockedHeader } from '@/components/marketplace/dossier-app-header';
import { DossierSchoolListDense } from '@/components/marketplace/dossier-school-list-dense';
import { DossierUnlockedApp } from '@/components/marketplace/dossier-unlocked-app';
import { Loader2 } from 'lucide-react';

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
  } = data;

  const racTotal = resteAChargeAfterSubsTotal ?? pack.packCapexTotal - pack.subventionsTotal;
  const dossierSoldOut = pack.soldOut && !unlocked;

  if (unlocked) {
    return (
      <div className="overflow-hidden">
        <Suspense fallback={<DossierAppLoading />}>
          <DossierUnlockedApp
            pack={pack}
            buildings={buildings}
            racTotal={racTotal}
            communesLabel={communesLabel}
            nomEpci={nomEpci}
            mgpe={mgpe}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DossierLockedHeader pack={pack} communesLabel={communesLabel} nomEpci={nomEpci} />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
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

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <p className="border-b border-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
            Aperçu des écoles
          </p>
          <PaywallOverlay
            buildingCount={buildings.length}
            capex={freePreview?.budgetRange}
            packId={pack.packId}
            soldOut={dossierSoldOut}
            slotsRemaining={pack.slotsRemaining}
          >
            <DossierSchoolListDense buildings={buildings} />
          </PaywallOverlay>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <CheckoutButton
            plan="dossier"
            packId={pack.packId}
            disabled={dossierSoldOut}
            className="btn-primary flex-1 py-3"
          >
            {dossierSoldOut ? COPY.soldOut : 'Débloquer ce territoire — 290 € HT'}
          </CheckoutButton>
          <CheckoutButton plan="pro" className="btn-secondary flex-1 py-3">
            {COPY.subscription} — 990 € HT/mois
          </CheckoutButton>
        </div>
      </div>
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
