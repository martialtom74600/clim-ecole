import type { MarketplaceBuilding } from '@/lib/types';
import { DossierSchoolListDense } from '@/components/marketplace/dossier-school-list-dense';
import { PackSchoolMap } from '@/components/marketplace/pack-school-map';
import { DossierArtisansStrip } from '@/components/marketplace/dossier-artisans-strip';

export function DossierTabProspect({ buildings }: { buildings: MarketplaceBuilding[] }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4 lg:grid lg:grid-cols-12">
      {/* Carte mobile — bandeau compact */}
      <div className="h-36 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white lg:hidden">
        <PackSchoolMap buildings={buildings} variant="embedded" fill showHeader={false} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white lg:col-span-7 lg:h-full">
        <DossierSchoolListDense buildings={buildings} />
        <DossierArtisansStrip buildings={buildings} />
      </div>

      <div className="hidden min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white lg:col-span-5 lg:flex lg:h-full lg:flex-col">
        <PackSchoolMap buildings={buildings} variant="embedded" fill showHeader={false} />
      </div>
    </div>
  );
}
