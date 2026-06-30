'use client';

import type { MarketplaceBuilding, MarketplacePack } from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { DOSSIER_CONTENT, DOSSIER_MAP_STICKY, DOSSIER_SECTION } from '@/lib/dossier-ui';
import { DossierSchoolListDense } from '@/components/marketplace/dossier-school-list-dense';
import { PackSchoolMap } from '@/components/marketplace/pack-school-map';
import { DossierSchoolMapMobile } from '@/components/marketplace/dossier-school-map-mobile';
import { DossierArtisansStrip } from '@/components/marketplace/dossier-artisans-strip';
import { DossierLockHint } from '@/components/marketplace/dossier-inline-paywall';
import { DossierPaywallCard } from '@/components/marketplace/dossier-paywall-card';
import { useAccountPreferences } from '@/hooks/use-account-preferences';

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

  /**
   * Carte desktop uniquement — interactive et sticky.
   * Sur mobile, on utilise DossierSchoolMapMobile (aperçu non bloquant + modale)
   * pour ne jamais piéger le scroll tactile.
   * Ce composant n'a pas de hauteur propre : le wrapper parent (DOSSIER_MAP_STICKY)
   * la définit, et h-full se propage jusqu'à Leaflet via la chaîne flex.
   */
  const desktopMap = (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-line shadow-card">
      {unlocked ? (
        <PackSchoolMap buildings={filtered} variant="embedded" fill showHeader={false} />
      ) : (
        <>
          {/*
           * Le blur wrapper doit aussi avoir h-full pour que PackSchoolMap
           * (qui utilise fill + flex h-full) puisse occuper la totalité.
           */}
          <div className="pointer-events-none h-full select-none blur-sm">
            <PackSchoolMap buildings={filtered} variant="embedded" fill showHeader={false} />
          </div>
          <DossierLockHint
            title="Carte GPS des écoles"
            subtitle="Localisation exacte visible après déblocage."
          />
        </>
      )}
    </div>
  );

  return (
    <div className={DOSSIER_CONTENT}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">

        {/*
         * MOBILE — aperçu carte non interactif + bouton « Voir sur la carte »
         * qui ouvre une modale plein écran. Le scroll de la page n'est jamais
         * capté par Leaflet.
         */}
        <div className="w-full lg:hidden">
          <DossierSchoolMapMobile
            buildings={filtered}
            locked={!unlocked}
          />
        </div>

        {/* Liste des écoles — col 7/12 sur desktop */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-lg border border-line">
            <DossierSchoolListDense
              buildings={filtered}
              pack={pack}
              territoryName={territoryName}
              blacklistUais={prefs.blacklistUais}
              locked={!unlocked}
              freePreview={freePreview}
              paywallPack={!unlocked ? pack : undefined}
            />
            {unlocked && <DossierArtisansStrip buildings={filtered} />}
          </div>
        </div>

        {/*
         * DESKTOP — carte sticky col 5/12.
         * DOSSIER_MAP_STICKY fournit sticky + top + h-[calc(100vh-200px)].
         * desktopMap s'y adapte via h-full.
         * lg:block masqué sur mobile (l'aperçu mobile est déjà rendu au-dessus).
         */}
        <div className="hidden lg:col-span-5 lg:block">
          <div className={DOSSIER_MAP_STICKY}>
            {desktopMap}
          </div>
        </div>

      </div>

      {/* CTA unique en bas de l'onglet — un seul point de conversion */}
      {!unlocked && (
        <section className={DOSSIER_SECTION}>
          <DossierPaywallCard
            pack={pack}
            freePreview={freePreview}
            soldOut={soldOut ?? false}
            embedded
          />
        </section>
      )}
    </div>
  );
}
