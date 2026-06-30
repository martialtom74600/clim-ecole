'use client';

import { useEffect, useRef } from 'react';
import type { MarketplaceBuilding } from '@/lib/types';
import { FRANCE_CENTER } from '@/lib/map-utils';
import { dpeHex } from '@/lib/dpe-colors';
import { cn } from '@/lib/utils';

export function PackSchoolMap({
  buildings,
  variant = 'card',
  className,
  showHeader = true,
  fill,
  interactive = true,
}: {
  buildings: MarketplaceBuilding[];
  variant?: 'card' | 'embedded';
  className?: string;
  showHeader?: boolean;
  fill?: boolean;
  /**
   * false = carte purement visuelle (aperçu) : tous les gestes Leaflet sont
   * désactivés pour que le scroll vertical de la page passe au travers sur mobile.
   */
  interactive?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const resizeRef = useRef<ResizeObserver | null>(null);

  const geo = buildings.filter(
    (b) => b.latitude != null && b.longitude != null && !b.detailsHidden,
  );

  useEffect(() => {
    const points = buildings.filter(
      (b) => b.latitude != null && b.longitude != null && !b.detailsHidden,
    );
    if (!containerRef.current || points.length === 0) return;

    let cancelled = false;

    async function init() {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current, {
        zoomControl: interactive,
        scrollWheelZoom: false,
        dragging: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 18,
      }).addTo(map);

      const bounds: [number, number][] = [];

      for (const b of points) {
        const lat = b.latitude!;
        const lon = b.longitude!;
        bounds.push([lat, lon]);

        const marker = L.circleMarker([lat, lon], {
          radius: 9,
          fillColor: dpeHex(b.classeDpe),
          color: '#fff',
          weight: 2,
          fillOpacity: 0.9,
        }).addTo(map);

        marker.bindTooltip(
          `<strong>${b.realName ?? b.publicName}</strong><br/>${b.realCommune ?? b.publicCommune} · DPE ${b.classeDpe}`,
          { direction: 'top', offset: [0, -6] },
        );
      }

      if (bounds.length === 1) {
        map.setView(bounds[0], 13);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 12 });
      } else {
        map.setView(FRANCE_CENTER, 6);
      }

      mapRef.current = map;

      /* Leaflet calcule mal sa taille s'il s'initialise dans un conteneur qui
         vient d'apparaître (modale, onglet, sticky) → on force le recalcul au
         montage puis à chaque redimensionnement du conteneur. */
      requestAnimationFrame(() => mapRef.current?.invalidateSize());
      const ro = new ResizeObserver(() => mapRef.current?.invalidateSize());
      ro.observe(containerRef.current);
      resizeRef.current = ro;
    }

    void init();

    return () => {
      cancelled = true;
      resizeRef.current?.disconnect();
      resizeRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [buildings, interactive]);

  if (geo.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-6 text-sm text-ink-muted',
          variant === 'card' ? 'card h-64' : 'h-full min-h-[12rem] rounded-xl bg-surface-muted',
          className,
        )}
      >
        Coordonnées GPS non disponibles pour ce territoire.
      </div>
    );
  }

  const mapShell = (
    <div
      ref={containerRef}
      className={cn(
        'radar-map-shell w-full',
        variant === 'card' ? 'h-72 md:h-96' : fill ? 'absolute inset-0' : 'h-full min-h-[16rem]',
        variant === 'embedded' && !fill && className,
      )}
    />
  );

  if (variant === 'embedded') {
    return (
      <div
        className={cn(
          fill ? 'flex h-full min-h-0 flex-col' : 'overflow-hidden',
          className,
        )}
      >
        {showHeader && (
          <div className="shrink-0 border-b border-line px-4 py-3">
            <p className="text-xs font-semibold text-ink-soft">Carte · DPE</p>
            <p className="text-[11px] text-ink-muted">
              {geo.length} établissement{geo.length > 1 ? 's' : ''} géolocalisé
              {geo.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
        <div className={cn('relative', fill ? 'min-h-0 flex-1' : undefined)}>
          {mapShell}
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {showHeader && (
        <div className="border-b border-line px-6 py-4">
          <h2 className="font-semibold text-ink">Carte des écoles</h2>
          <p className="mt-1 text-xs text-ink-muted">
            {geo.length} établissement{geo.length > 1 ? 's' : ''} géolocalisé
            {geo.length > 1 ? 's' : ''} · couleur = classe DPE
          </p>
        </div>
      )}
      {mapShell}
    </div>
  );
}
