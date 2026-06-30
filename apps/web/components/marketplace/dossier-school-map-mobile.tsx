'use client';

import { useEffect, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import type { MarketplaceBuilding } from '@/lib/types';
import { PackSchoolMap } from '@/components/marketplace/pack-school-map';
import { DossierLockHint } from '@/components/marketplace/dossier-inline-paywall';
import { cn } from '@/lib/utils';

/**
 * Carte écoles — version mobile non bloquante.
 *
 * Le problème résolu : une carte Leaflet interactive inline (h-400px) capte le
 * geste de défilement tactile (drag = pan) et piège l'utilisateur au milieu de
 * la page. Ici, l'aperçu est purement visuel (`interactive={false}` → le scroll
 * passe au travers) ; l'interaction réelle se fait dans une modale plein écran.
 */
export function DossierSchoolMapMobile({
  buildings,
  locked,
}: {
  buildings: MarketplaceBuilding[];
  locked: boolean;
}) {
  const [open, setOpen] = useState(false);

  /* Verrou de scroll de la page derrière la modale plein écran. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <div className="relative h-44 w-full overflow-hidden rounded-xl border border-line shadow-card">
        <div className={cn('pointer-events-none h-full select-none', locked && 'blur-sm')}>
          <PackSchoolMap
            buildings={buildings}
            variant="embedded"
            fill
            showHeader={false}
            interactive={false}
          />
        </div>

        {locked ? (
          <DossierLockHint
            title="Carte GPS des écoles"
            subtitle="Localisation exacte après déblocage."
          />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute inset-x-3 bottom-3 inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white/95 px-4 py-2.5 text-sm font-medium text-ink shadow-raised backdrop-blur-sm transition-transform active:scale-[0.98]"
          >
            <Maximize2 className="h-4 w-4" />
            Voir sur la carte
          </button>
        )}
      </div>

      {open && !locked && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-white">
          <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Carte des écoles</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer la carte"
              className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            <PackSchoolMap buildings={buildings} variant="embedded" fill showHeader={false} />
          </div>
        </div>
      )}
    </>
  );
}
