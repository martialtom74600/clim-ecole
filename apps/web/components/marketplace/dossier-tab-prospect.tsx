'use client';

import type { MarketplaceBuilding, MarketplacePack } from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { COPY, SCORE_GRADES } from '@/lib/copy';
import { DOSSIER_CONTENT, DOSSIER_MAP_STICKY } from '@/lib/dossier-ui';
import { DossierSchoolListDense } from '@/components/marketplace/dossier-school-list-dense';
import { PackSchoolMap } from '@/components/marketplace/pack-school-map';
import { DossierArtisansStrip } from '@/components/marketplace/dossier-artisans-strip';
import { DossierInlinePaywall } from '@/components/marketplace/dossier-inline-paywall';
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
   * Contenu de la carte — partagé entre mobile et desktop.
   * Ce composant n'a pas de hauteur propre : c'est le wrapper parent
   * (h-[400px] mobile / DOSSIER_MAP_STICKY desktop) qui la définit.
   * Le h-full ici se propage jusqu'à Leaflet via la chaîne flex de PackSchoolMap.
   */
  const mapContent = (
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
      {!unlocked && (
        <div className="mb-6 rounded-xl border border-line bg-surface-sunken p-4">
          <p className="label-caps mb-3">Aperçu gratuit de ce territoire</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: 'Écoles concernées',
                value: String(pack.batimentCount),
              },
              {
                label: 'Budget estimé',
                value: freePreview?.budgetRange ?? pack.budgetRange,
              },
              {
                label: 'Profil DPE',
                value: freePreview?.dpeProfile.worstClass ?? '—',
                hint: freePreview?.dpeProfile.label,
              },
              {
                label: COPY.scorePriorite,
                value: `${pack.radarGrade} · ${pack.radarScore}/100`,
                hint: SCORE_GRADES[pack.radarGrade],
              },
            ].map(({ label, value, hint }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-[11px] text-ink-subtle">{label}</span>
                <span className="text-sm font-semibold text-ink">{value}</span>
                {hint && <span className="text-[11px] text-ink-subtle">{hint}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">

        {/*
         * MOBILE — carte avec hauteur fixe en haut, liste scrollable en dessous.
         * h-[400px] : hauteur explicite indispensable pour que Leaflet s'initialise.
         * mb-8 : respiration avant la liste.
         * Pas de sticky sur mobile.
         */}
        <div className="h-[400px] w-full lg:hidden">
          {mapContent}
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
              paywallSoldOut={soldOut}
            />
            {unlocked && <DossierArtisansStrip buildings={filtered} />}
          </div>
        </div>

        {/*
         * DESKTOP — carte sticky col 5/12.
         * DOSSIER_MAP_STICKY fournit sticky + top + h-[calc(100vh-200px)].
         * mapContent s'y adapte via h-full.
         * lg:block masqué sur mobile (la carte mobile est déjà rendue au-dessus).
         */}
        <div className="hidden lg:col-span-5 lg:block">
          <div className={DOSSIER_MAP_STICKY}>
            {mapContent}
          </div>
        </div>

      </div>
    </div>
  );
}
