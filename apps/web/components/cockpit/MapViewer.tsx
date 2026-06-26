'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MapMarker, ClosingLevel } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MapFocusPanel } from '@/components/cockpit/map-focus-panel';
import { EmptyState } from '@/components/ui/empty-state';

const AURA_CENTER: [number, number] = [45.75, 4.85];
const DEFAULT_ZOOM = 8;

const DPE_COLORS: Record<string, string> = {
  A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f59e0b',
  E: '#f97316', F: '#ef4444', G: '#e11d48',
};

function dpeColor(classe: string): string {
  return DPE_COLORS[classe?.charAt(0)?.toUpperCase() ?? '?'] ?? '#2dd4bf';
}

type TempFilter = 'all' | ClosingLevel;

interface MapViewerProps {
  markers: MapMarker[];
  initialEpci?: string;
}

export default function MapViewer({ markers, initialEpci }: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const clusterRef = useRef<import('leaflet').MarkerClusterGroup | null>(null);
  const initialFitDone = useRef(false);
  const epciApplied = useRef(false);

  const [tempFilter, setTempFilter] = useState<TempFilter>('all');
  const [dpeFilter, setDpeFilter] = useState<string>('all');
  const [epciFilter, setEpciFilter] = useState<string | null>(initialEpci ?? null);
  const [selected, setSelected] = useState<MapMarker | null>(null);
  const selectRef = useRef<(m: MapMarker) => void>(() => {});

  selectRef.current = (m: MapMarker) => setSelected(m);

  const filtered = useMemo(() => {
    return markers.filter((m) => {
      if (epciFilter && m.codeEpci !== epciFilter) return false;
      if (tempFilter !== 'all' && m.temperatureLevel !== tempFilter) return false;
      if (dpeFilter !== 'all' && m.dpe.charAt(0).toUpperCase() !== dpeFilter) return false;
      return true;
    });
  }, [markers, tempFilter, dpeFilter, epciFilter]);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    async function init() {
      const L = (await import('leaflet')).default;
      await import('leaflet.markercluster');

      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          center: AURA_CENTER,
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OSM &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
      }

      clusterRef.current?.clearLayers();
      const cluster = (L as typeof L & { markerClusterGroup: () => import('leaflet').MarkerClusterGroup }).markerClusterGroup({
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: (c) => {
          const count = c.getChildCount();
          const size = count > 50 ? 44 : count > 20 ? 38 : 32;
          return L.divIcon({
            html: `<div style="background:#2dd4bf;color:#08080a;width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid rgba(255,255,255,0.25)">${count}</div>`,
            className: '',
            iconSize: [size, size],
          });
        },
      });

      for (const m of filtered) {
        const color = dpeColor(m.dpe);
        const marker = L.circleMarker([m.lat, m.lon], {
          radius: 8,
          fillColor: color,
          color: 'rgba(255,255,255,0.4)',
          weight: 2,
          fillOpacity: 0.95,
        });

        marker.on('click', () => selectRef.current(m));
        cluster.addLayer(marker);
      }

      cluster.addTo(mapRef.current!);
      clusterRef.current = cluster;

      if (filtered.length > 0 && !initialFitDone.current) {
        const bounds = L.latLngBounds(filtered.map((m) => [m.lat, m.lon] as [number, number]));
        mapRef.current!.fitBounds(bounds.pad(0.08));
        initialFitDone.current = true;
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [filtered]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (selected && !filtered.find((m) => m.id === selected.id)) {
      setSelected(null);
    }
  }, [filtered, selected]);

  useEffect(() => {
    if (selected && mapRef.current) {
      mapRef.current.flyTo([selected.lat, selected.lon], 13, { duration: 0.8 });
    }
  }, [selected]);

  useEffect(() => {
    if (!initialEpci || epciApplied.current || !markers.length) return;
    const epciMarkers = markers.filter((m) => m.codeEpci === initialEpci);
    if (epciMarkers.length > 0) {
      setEpciFilter(initialEpci);
      setSelected(epciMarkers[0]);
      epciApplied.current = true;
    }
  }, [initialEpci, markers]);

  const chips: { id: string; label: string; active: boolean; onClick: () => void }[] = [
    {
      id: 'all',
      label: 'Tous',
      active: tempFilter === 'all' && dpeFilter === 'all' && !epciFilter,
      onClick: () => {
        setTempFilter('all');
        setDpeFilter('all');
        setEpciFilter(null);
      },
    },
    {
      id: 'chaud',
      label: '🔥 Priorité',
      active: tempFilter === 'chaud',
      onClick: () => setTempFilter(tempFilter === 'chaud' ? 'all' : 'chaud'),
    },
    {
      id: 'F',
      label: 'DPE F-G',
      active: dpeFilter === 'F',
      onClick: () => setDpeFilter(dpeFilter === 'F' ? 'all' : 'F'),
    },
  ];

  if (epciFilter) {
    chips.unshift({
      id: 'epci',
      label: `Territoire ${epciFilter}`,
      active: true,
      onClick: () => setEpciFilter(null),
    });
  }

  function resetFilters() {
    setTempFilter('all');
    setDpeFilter('all');
    setEpciFilter(null);
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-3 z-[1000] flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2 md:left-4 md:top-4">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={c.onClick}
            className={cn('chip backdrop-blur-md', c.active && 'chip-active')}
          >
            {c.label}
          </button>
        ))}
        <span className="chip pointer-events-none tabular-nums">{filtered.length} écoles</span>
      </div>

      {!selected && filtered.length > 0 && (
        <div className="absolute bottom-3 left-3 z-[1000] hidden panel px-4 py-3 backdrop-blur-md sm:block md:bottom-4 md:left-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">Légende DPE</p>
          <div className="flex flex-wrap gap-3">
            {['F', 'E', 'D', 'G'].map((l) => (
              <div key={l} className="flex items-center gap-1.5 text-xs text-zen-muted">
                <span className="h-3 w-3 rounded-full" style={{ background: dpeColor(l) }} />
                {l}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-600">Cliquez un point pour ouvrir la fiche</p>
        </div>
      )}

      {selected && (
        <MapFocusPanel marker={selected} onClose={() => setSelected(null)} />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune école ne correspond"
          description="Essayez d’élargir les filtres ou de retirer le filtre territoire."
          className="map-shell flex"
          action={
            <button type="button" onClick={resetFilters} className="chip chip-active">
              Réinitialiser les filtres
            </button>
          }
        />
      ) : (
        <div
          ref={containerRef}
          className={cn(
            'map-shell w-full rounded-2xl border border-white/[0.08] bg-zen-panel transition-[margin] duration-300',
            selected && 'lg:mr-[400px]',
          )}
        />
      )}
    </div>
  );
}
