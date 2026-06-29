'use client';

import type { MarketplaceBuilding, MarketplacePack } from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { DOSSIER_CONTENT } from '@/lib/dossier-ui';
import { DossierSchoolListDense } from '@/components/marketplace/dossier-school-list-dense';
import { PackSchoolMap } from '@/components/marketplace/pack-school-map';
import { DossierArtisansStrip } from '@/components/marketplace/dossier-artisans-strip';
import { DossierInlinePaywall } from '@/components/marketplace/dossier-inline-paywall';
import { useAccountPreferences } from '@/hooks/use-account-preferences';
import { cn } from '@/lib/utils';

export function DossierTabProspect({
  buildings,
  pack,
  unlocked,
  soldOut,
  freePreview,
  territoryName,
}: {
  buildings: MarketplaceBuilding[];
  pack: MarketplacePack;
  unlocked: boolean;
  soldOut?: boolean;
  freePreview?: TerritoryFreePreview;
  territoryName: string;
}) {
  const { prefs } = useAccountPreferences();
  const filtered = buildings.filter(
    (b) => !b.codeUai || !prefs.blacklistUais.includes(b.codeUai),
  );

  const mapShell = (className?: string) => (
    <div className={cn('relative overflow-hidden rounded-lg border border-slate-200', className)}>
      {unlocked ? (
        <PackSchoolMap buildings={filtered} variant="embedded" fill showHeader={false} />
      ) : (
        <>
          <div className="pointer-events-none min-h-[16rem] blur-sm select-none">
            <PackSchoolMap buildings={filtered} variant="embedded" fill showHeader={false} />
          </div>
          <DossierInlinePaywall
            pack={pack}
            soldOut={soldOut}
            title="Carte GPS des écoles"
            subtitle="Débloquez pour voir la localisation exacte."
          />
        </>
      )}
    </div>
  );

  return (
    <div className={DOSSIER_CONTENT}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:hidden">{mapShell('min-h-[16rem]')}</div>

        <div className="lg:col-span-7">
          <div className="border border-slate-200">
            <DossierSchoolListDense
              buildings={filtered}
              pack={pack}
              territoryName={territoryName}
              blacklistUais={prefs.blacklistUais}
              locked={!unlocked}
              freePreview={freePreview}
              paywallPack={!unlocked ? pack : undefined}
              paywallSoldOut={soldOut}
            />
            {unlocked && <DossierArtisansStrip buildings={filtered} />}
          </div>
        </div>

        <div className="hidden lg:col-span-5 lg:block">
          {mapShell('sticky top-[8.5rem] h-[calc(100vh-11rem)]')}
        </div>
      </div>
    </div>
  );
}
