'use client';

import { useEffect, useRef } from 'react';
import type { MarketplaceBuilding } from '@/lib/types';
import { FRANCE_CENTER } from '@/lib/map-utils';

const DPE_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f59e0b',
  E: '#f97316',
  F: '#ef4444',
  G: '#e11d48',
};

function dpeColor(classe: string): string {
  return DPE_COLORS[classe?.charAt(0)?.toUpperCase() ?? '?'] ?? '#2dd4bf';
}

export function PackSchoolMap({ buildings }: { buildings: MarketplaceBuilding[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);

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
        zoomControl: true,
        scrollWheelZoom: false,
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
          fillColor: dpeColor(b.classeDpe),
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
    }

    void init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [buildings]);

  if (geo.length === 0) {
    return (
      <div className="card flex h-64 items-center justify-center p-6 text-sm text-radar-muted">
        Coordonnées GPS non disponibles pour ce territoire.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-radar-border px-6 py-4">
        <h2 className="font-semibold text-radar-text">Carte des écoles</h2>
        <p className="mt-1 text-xs text-radar-muted">
          {geo.length} établissement{geo.length > 1 ? 's' : ''} géolocalisé{geo.length > 1 ? 's' : ''} · couleur = classe DPE
        </p>
      </div>
      <div ref={containerRef} className="radar-map-shell h-72 w-full md:h-96" />
    </div>
  );
}
