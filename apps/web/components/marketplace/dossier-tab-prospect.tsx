'use client';

import type { MarketplaceBuilding, MarketplacePack } from '@/lib/types';
import { DossierSchoolListDense } from '@/components/marketplace/dossier-school-list-dense';
import { PackSchoolMap } from '@/components/marketplace/pack-school-map';
import { DossierArtisansStrip } from '@/components/marketplace/dossier-artisans-strip';
import { useAccountPreferences } from '@/hooks/use-account-preferences';

export function DossierTabProspect({
  buildings,
  pack,
  territoryName,
}: {
  buildings: MarketplaceBuilding[];
  pack: MarketplacePack;
  territoryName: string;
}) {
  const { prefs } = useAccountPreferences();
  const filtered = buildings.filter(
    (b) => !b.codeUai || !prefs.blacklistUais.includes(b.codeUai),
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 bg-surface-sunken p-4 lg:grid lg:grid-cols-12">
      <div className="h-36 shrink-0 overflow-hidden rounded-xl border border-line bg-white lg:hidden">
        <PackSchoolMap buildings={filtered} variant="embedded" fill showHeader={false} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card lg:col-span-7 lg:h-full">
        <DossierSchoolListDense
          buildings={filtered}
          pack={pack}
          territoryName={territoryName}
          blacklistUais={prefs.blacklistUais}
        />
        <DossierArtisansStrip buildings={filtered} />
      </div>

      <div className="hidden min-h-0 overflow-hidden rounded-xl border border-line bg-white shadow-card lg:col-span-5 lg:flex lg:h-full lg:flex-col">
        <PackSchoolMap buildings={filtered} variant="embedded" fill showHeader={false} />
      </div>
    </div>
  );
}
