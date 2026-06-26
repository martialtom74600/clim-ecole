/** Couches réseau — mairies, artisans, liens */

import { createMairieIcon, createArtisanIcon } from './mapMarkers.js';
import { mairiePopupHtml, artisanPopupHtml } from './mapPopups.js';

const Leaflet = typeof L !== 'undefined' ? L : window.L;

const POPUP_OPTS = {
  closeButton: false,
  offset: [0, -10],
  className: 'zen-popup-wrap',
};

function bindHoverPopup(layer, html) {
  layer.bindPopup(html, POPUP_OPTS);
  layer.on('mouseover', () => layer.openPopup());
  layer.on('mouseout', () => layer.closePopup());
}

export function buildMairieMarkers(mairies, { onClick, fmt, fmtEur }) {
  const group = Leaflet.layerGroup();
  for (const m of mairies ?? []) {
    if (m.lat == null || m.lon == null) continue;
    const marker = Leaflet.marker([m.lat, m.lon], {
      icon: createMairieIcon(),
      pane: 'mairie-markers',
    });
    bindHoverPopup(marker, mairiePopupHtml(m, { fmt, fmtEur }));
    marker.on('click', () => onClick?.(m));
    group.addLayer(marker);
  }
  return group;
}

export function buildArtisanMarkers(artisans, { onClick, fmtEur }) {
  const group = Leaflet.layerGroup();
  for (const a of artisans ?? []) {
    if (a.lat == null || a.lon == null) continue;
    const marker = Leaflet.marker([a.lat, a.lon], {
      icon: createArtisanIcon({ approximate: a.approximate }),
      pane: 'artisan-markers',
    });
    bindHoverPopup(marker, artisanPopupHtml(a, { fmtEur }));
    marker.on('click', () => onClick?.(a));
    group.addLayer(marker);
  }
  return group;
}

function linkStyle(type) {
  if (type === 'school-artisan-package') {
    return { color: '#14b8a6', weight: 2, opacity: 0.65, dashArray: '6 8' };
  }
  return { color: '#71717a', weight: 1.5, opacity: 0.45, dashArray: '4 10' };
}

/**
 * Liens visibles si réseau activé ET (sélection active ou mode « tout le réseau filtré »).
 * Par défaut : uniquement autour de la sélection.
 */
export function buildNetworkLayer(links, { selectedSchoolId, selectedPackageId, selectedMairieInsee, visibleSchoolIds }) {
  const group = Leaflet.layerGroup();
  const visible = new Set(visibleSchoolIds ?? []);
  const schoolSet = new Set();

  if (selectedSchoolId) schoolSet.add(selectedSchoolId);
  if (selectedPackageId) {
    for (const link of links ?? []) {
      if (link.packageId === selectedPackageId && link.schoolId) {
        schoolSet.add(link.schoolId);
      }
    }
  }
  if (selectedMairieInsee) {
    for (const link of links ?? []) {
      if (link.type === 'mairie-school' && link.communeInsee === selectedMairieInsee && link.schoolId) {
        schoolSet.add(link.schoolId);
      }
    }
  }

  const hasSelection = schoolSet.size > 0;
  if (!hasSelection) return group;

  for (const link of links ?? []) {
    const sid = link.schoolId;
    if (!sid || !visible.has(sid)) continue;
    if (!schoolSet.has(sid)) continue;
    if (!link.coords?.length) continue;

    const line = Leaflet.polyline(link.coords, {
      ...linkStyle(link.type),
      pane: 'network-links',
      interactive: false,
    });
    group.addLayer(line);
  }

  return group;
}

export function fitPackageBounds(map, pkg, schools) {
  if (!map || !pkg) return;
  const ids = new Set(pkg.schoolIds ?? []);
  const pts = (schools ?? []).filter((s) => ids.has(s.id)).map((s) => [s.lat, s.lon]);
  if (pts.length >= 2) {
    map.fitBounds(pts, { padding: [80, 80], maxZoom: 12, duration: 0.6 });
    return;
  }
  if (pkg.center?.lat != null) {
    map.flyTo([pkg.center.lat, pkg.center.lng], 11, { duration: 0.5 });
  }
}
