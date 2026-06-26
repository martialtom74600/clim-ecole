'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  AURA_CENTER,
  DEFAULT_ZOOM,
  capexToRadius,
  dpeColor,
  gradeColor,
  type DepartmentMarker,
  type TerritoryMarker,
} from '@/lib/map-utils';
import type { MapMarker } from '@/lib/types';
import { formatEur } from '@/lib/format';

export type RadarMapMode = 'territories' | 'departments' | 'schools';

interface RadarMapProps {
  mode?: RadarMapMode;
  territories?: TerritoryMarker[];
  departments?: DepartmentMarker[];
  schools?: MapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  className?: string;
  interactive?: boolean;
  showControls?: boolean;
  fitOnLoad?: boolean;
  zoom?: number;
}

type LeafletModule = typeof import('leaflet');
type MapPoint = { id: string; lat: number; lon: number };

interface MarkerRecord {
  marker: import('leaflet').Marker;
  pointId: string;
  isHot?: boolean;
}

function territoryColor(t: TerritoryMarker) {
  return t.isHot ? '#DC2626' : gradeColor(t.radarGrade);
}

function territorySize(t: TerritoryMarker) {
  return capexToRadius(t.capex) * 2;
}

function buildTerritoryIcon(L: LeafletModule, t: TerritoryMarker) {
  const size = territorySize(t);
  const color = territoryColor(t);
  const html = `
    <div class="radar-marker-wrap" style="width:${size}px;height:${size}px" data-hot="${t.isHot}">
      <span class="radar-marker-pulse is-hidden" style="--pulse-color:${color}"></span>
      <span
        class="radar-marker-dot${t.isHot ? ' is-hot' : ''}"
        style="--dot-size:${size}px;--dot-color:${color}"
      ></span>
    </div>`;
  return L.divIcon({
    className: 'radar-marker-icon',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function buildDepartmentIcon(L: LeafletModule, d: DepartmentMarker, selected: boolean) {
  const base = capexToRadius(d.totalCapex, 14, 36);
  const size = selected ? base + 6 : base;
  const html = `
    <div class="radar-marker-wrap radar-dept-marker" style="width:${size}px;height:${size}px">
      <span class="radar-marker-pulse is-hidden" style="--pulse-color:#18181B"></span>
      <span class="radar-marker-dot radar-dept-dot${selected ? ' is-selected' : ''}" style="--dot-size:${size}px;--dot-color:#18181B">
        <span class="radar-dept-count">${d.territoryCount}</span>
      </span>
    </div>`;
  return L.divIcon({
    className: 'radar-marker-icon',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function buildSchoolIcon(L: LeafletModule, s: MapMarker) {
  const size = 14;
  const color = dpeColor(s.dpe);
  const html = `<span class="radar-marker-dot is-school" style="--dot-size:${size}px;--dot-color:${color}"></span>`;
  return L.divIcon({
    className: 'radar-marker-icon',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function applySelection(record: MarkerRecord, selected: boolean) {
  const el = record.marker.getElement();
  if (!el) return;

  const dot = el.querySelector('.radar-marker-dot');
  const pulse = el.querySelector('.radar-marker-pulse');
  dot?.classList.toggle('is-selected', selected);

  if (selected) {
    pulse?.classList.remove('is-hidden');
    record.marker.setZIndexOffset(1000);
    record.marker.openTooltip();
  } else {
    pulse?.classList.add('is-hidden');
    record.marker.setZIndexOffset(record.isHot ? 500 : 0);
    record.marker.closeTooltip();
  }
}

function boundsKey(points: MapPoint[]) {
  return points.map((p) => p.id).sort().join('|');
}

export function RadarMap({
  mode = 'departments',
  territories = [],
  departments = [],
  schools = [],
  selectedId,
  onSelect,
  className,
  interactive = true,
  showControls = true,
  fitOnLoad = true,
  zoom = DEFAULT_ZOOM,
}: RadarMapProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const layerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const markersRef = useRef<Map<string, MarkerRecord>>(new Map());
  const onSelectRef = useRef(onSelect);
  const selectedIdRef = useRef(selectedId);
  const initialFitDone = useRef(false);
  const lastBoundsKey = useRef('');
  const prevSelectedId = useRef<string | null | undefined>(undefined);
  const [ready, setReady] = useState(false);

  onSelectRef.current = onSelect;
  selectedIdRef.current = selectedId;

  const points = useMemo<MapPoint[]>(() => {
    if (mode === 'departments') {
      return departments.map((d) => ({ id: d.id, lat: d.lat, lon: d.lon }));
    }
    if (mode === 'territories') {
      return territories.map((t) => ({ id: t.packId, lat: t.lat, lon: t.lon }));
    }
    return schools.map((s) => ({ id: s.id, lat: s.lat, lon: s.lon }));
  }, [mode, departments, territories, schools]);

  const pointsKey = useMemo(() => boundsKey(points), [points]);

  const fitToPoints = useCallback((animate = true) => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || points.length === 0) return;

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number]));
    map.fitBounds(bounds.pad(0.14), {
      animate,
      duration: animate ? 0.85 : 0,
      paddingTopLeft: [16, 16],
      paddingBottomRight: [16, 16],
    });
  }, [points]);

  const flyToPoint = useCallback((lat: number, lon: number, z = 10.5) => {
    mapRef.current?.flyTo([lat, lon], z, { duration: 0.9, easeLinearity: 0.22 });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    async function init() {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      leafletRef.current = L;
      const map = L.map(containerRef.current, {
        center: AURA_CENTER,
        zoom,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: false,
        fadeAnimation: true,
        zoomAnimation: true,
        markerZoomAnimation: true,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 19, updateWhenZooming: true, keepBuffer: 4 },
      ).addTo(map);

      if (showControls) {
        L.control.zoom({ position: 'bottomright' }).addTo(map);
      }

      L.control
        .attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('© OSM · CARTO')
        .addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    }

    init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      leafletRef.current = null;
      markersRef.current.clear();
      initialFitDone.current = false;
      lastBoundsKey.current = '';
    };
  }, [showControls, zoom]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const el = shellRef.current ?? containerRef.current;
    if (!el) return;

    let resizeTimer: ReturnType<typeof setTimeout>;
    const invalidate = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => map.invalidateSize({ animate: true }), 80);
    };

    const observer = new ResizeObserver(invalidate);
    observer.observe(el);
    invalidate();

    return () => {
      observer.disconnect();
      clearTimeout(resizeTimer);
    };
  }, [ready]);

  // Sync marker data (without selection styling)
  useEffect(() => {
    if (!ready || !mapRef.current || !layerRef.current || !leafletRef.current) return;

    const L = leafletRef.current;
    const layer = layerRef.current;
    const current = markersRef.current;
    const nextIds = new Set(points.map((p) => p.id));
    const activeSelection = selectedIdRef.current;

    for (const [id, record] of [...current.entries()]) {
      if (nextIds.has(id)) continue;
      const wrap = record.marker.getElement()?.querySelector('.radar-marker-wrap');
      wrap?.classList.add('is-exiting');
      const marker = record.marker;
      window.setTimeout(() => {
        layer.removeLayer(marker);
        current.delete(id);
      }, 280);
    }

    if (mode === 'departments') {
      for (const d of departments) {
        const existing = current.get(d.id);
        const selected = activeSelection === d.id;

        if (existing) {
          existing.marker.setIcon(buildDepartmentIcon(L, d, selected));
          if (existing.marker.getTooltip()) {
            existing.marker.setTooltipContent(
              `<div class="radar-tooltip-inner"><strong>${d.department}</strong><span>${d.territoryCount} territoires · ${formatEur(d.totalCapex, true)}</span><span style="opacity:0.7;font-size:10px">Vue département — localisation précise après achat</span></div>`,
            );
          }
          continue;
        }

        const marker = L.marker([d.lat, d.lon], {
          icon: buildDepartmentIcon(L, d, selected),
          zIndexOffset: selected ? 1000 : 0,
        });

        marker.on('add', () => {
          applySelection({ marker, pointId: d.id }, selected);
        });

        if (interactive) {
          marker.on('click', () => onSelectRef.current?.(d.id));
          marker.bindTooltip(
            `<div class="radar-tooltip-inner"><strong>${d.department}</strong><span>${d.territoryCount} territoires · ${formatEur(d.totalCapex, true)}</span><span style="opacity:0.7;font-size:10px">Vue département — localisation précise après achat</span></div>`,
            { direction: 'top', offset: [0, -6], opacity: 1, className: 'radar-tooltip' },
          );
        }

        marker.addTo(layer);
        current.set(d.id, { marker, pointId: d.id });
      }
    } else if (mode === 'territories') {
      for (const t of territories) {
        const existing = current.get(t.packId);

        if (existing) {
          existing.marker.setLatLng([t.lat, t.lon]);
          existing.isHot = t.isHot;
          if (existing.marker.getTooltip()) {
            existing.marker.setTooltipContent(
              `<div class="radar-tooltip-inner"><strong>${t.department}</strong><span>${formatEur(t.capex, true)} · ${t.schoolCount} écoles</span><span style="opacity:0.7;font-size:10px">Identité masquée</span></div>`,
            );
          }
          continue;
        }

        const marker = L.marker([t.lat, t.lon], {
          icon: buildTerritoryIcon(L, t),
          zIndexOffset: t.isHot ? 500 : 0,
        });

        marker.on('add', () => {
          const wrap = marker.getElement()?.querySelector('.radar-marker-wrap');
          if (wrap) {
            wrap.classList.add('is-entering');
            requestAnimationFrame(() => wrap.classList.remove('is-entering'));
          }
          applySelection({ marker, pointId: t.packId, isHot: t.isHot }, activeSelection === t.packId);
        });

        if (interactive) {
          marker.on('click', () => onSelectRef.current?.(t.packId));
          marker.bindTooltip(
            `<div class="radar-tooltip-inner"><strong>${t.department}</strong><span>${formatEur(t.capex, true)} · ${t.schoolCount} écoles</span><span style="opacity:0.7;font-size:10px">Identité masquée</span></div>`,
            { direction: 'top', offset: [0, -6], opacity: 1, className: 'radar-tooltip' },
          );
        }

        marker.addTo(layer);
        current.set(t.packId, { marker, pointId: t.packId, isHot: t.isHot });
      }
    } else if (mode === 'schools') {
      for (const s of schools) {
        const existing = current.get(s.id);
        if (existing) {
          existing.marker.setLatLng([s.lat, s.lon]);
          continue;
        }

        const marker = L.marker([s.lat, s.lon], { icon: buildSchoolIcon(L, s) });
        if (interactive) {
          marker.on('click', () => onSelectRef.current?.(s.id));
        }
        marker.addTo(layer);
        current.set(s.id, { marker, pointId: s.id });
      }
    }

    const filterChanged = lastBoundsKey.current !== pointsKey;
    const shouldFit = fitOnLoad && points.length > 0 && !activeSelection &&
      (!initialFitDone.current || filterChanged);

    if (shouldFit) {
      fitToPoints(true);
      initialFitDone.current = true;
    }

    if (filterChanged) {
      lastBoundsKey.current = pointsKey;
    }
  }, [ready, mode, departments, territories, schools, points, pointsKey, interactive, fitOnLoad, fitToPoints]);

  // Selection styling — CSS transitions, no DOM rebuild
  useEffect(() => {
    if (!ready) return;
    for (const [id, record] of markersRef.current) {
      applySelection(record, id === selectedId);
    }
  }, [selectedId, ready]);

  // Fly to selected point
  useEffect(() => {
    if (!ready) return;

    if (selectedId) {
      const d = departments.find((x) => x.id === selectedId);
      const t = territories.find((x) => x.packId === selectedId);
      const s = schools.find((x) => x.id === selectedId);
      const target = d ?? t ?? s;
      if (target) flyToPoint(target.lat, target.lon, mode === 'departments' ? 9 : 10.5);
    } else if (prevSelectedId.current && points.length > 0) {
      fitToPoints(true);
    }

    prevSelectedId.current = selectedId;
  }, [selectedId, ready, departments, territories, schools, flyToPoint, fitToPoints, points.length, mode]);

  return (
    <div ref={shellRef} className={cn('radar-map-shell', className)}>
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
