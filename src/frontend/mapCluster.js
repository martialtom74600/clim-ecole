/** Regroupement écoles — par EPCI (communauté de communes), jamais entre intercos */

import { abbreviateEpciName } from './mapStyle.js';

const Leaflet = typeof L !== 'undefined' ? L : window.L;

export function resolveSchoolEpciKey(school) {
  const codeEpci = String(school.codeEpci ?? '').trim();
  if (/^\d{9}$/.test(codeEpci)) {
    return `EPCI-${codeEpci}`;
  }
  const pkg = String(school.packageId ?? '');
  if (pkg.startsWith('EPCI-')) {
    return pkg;
  }
  const insee = String(school.codeInsee ?? '').trim();
  if (insee) {
    return `COMMUNE-${insee}`;
  }
  return `SOLO-${school.id}`;
}

function clusterIcon(count, { label = null } = {}) {
  let sizeClass = 'marker-cluster-sm';
  if (count >= 10) sizeClass = 'marker-cluster-md';
  if (count >= 30) sizeClass = 'marker-cluster-lg';
  const sub = label
    ? `<span class="marker-cluster-epci">${label}</span>`
    : '';
  return Leaflet.divIcon({
    html: `<div class="marker-cluster-inner ${sizeClass}"><span>${count}</span>${sub}</div>`,
    className: 'marker-cluster-wrap',
    iconSize: Leaflet.point(label ? 52 : 44, label ? 52 : 44),
  });
}

function createEpciClusterGroup(epciKey, nomEpci) {
  const shortLabel = nomEpci ? abbreviateEpciName(nomEpci).slice(0, 12) : null;
  return Leaflet.markerClusterGroup({
    disableClusteringAtZoom: 12,
    maxClusterRadius: 26,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    chunkedLoading: true,
    spiderLegPolylineOptions: { weight: 1, color: '#27272a', opacity: 0.4 },
    iconCreateFunction: (cluster) => clusterIcon(cluster.getChildCount(), { label: shortLabel }),
    // Empêche tout regroupement inter-EPCI (groupes isolés)
    _epciKey: epciKey,
  });
}

/** Couche détail / territoire — un cluster Leaflet par EPCI. */
export function createEpciPartitionedClusterLayer({ schools, markersById, visibleFn }) {
  const root = Leaflet.layerGroup();
  const groups = new Map();

  for (const school of schools) {
    const epciKey = resolveSchoolEpciKey(school);
    if (!groups.has(epciKey)) {
      groups.set(epciKey, { nomEpci: school.nomEpci ?? null, schools: [] });
    }
    groups.get(epciKey).schools.push(school);
  }

  for (const [epciKey, group] of groups) {
    const cluster = createEpciClusterGroup(epciKey, group.nomEpci);
    for (const school of group.schools) {
      const marker = markersById[school.id];
      if (marker && visibleFn(school.id)) {
        cluster.addLayer(marker);
      }
    }
    root.addLayer(cluster);
  }

  return root;
}

export function createEpciHubIcon(count, nomEpci, { highlighted = false } = {}) {
  const label = abbreviateEpciName(nomEpci || 'EPCI');
  const short = label.length > 16 ? `${label.slice(0, 14)}…` : label;
  return Leaflet.divIcon({
    html: `<div class="marker-epci-hub${highlighted ? ' is-hl' : ''}">
      <span class="marker-epci-hub-count">${count}</span>
      <span class="marker-epci-hub-label">${short}</span>
    </div>`,
    className: 'marker-epci-hub-wrap',
    iconSize: [80, 36],
    iconAnchor: [40, 18],
  });
}

/** Vue d'ensemble — un marqueur par communauté de communes (centre EPCI). */
export function createEpciHubLayer({ packages, schools, visibleFn, onHubClick }) {
  const root = Leaflet.layerGroup();
  const visibleIds = new Set(schools.filter((s) => visibleFn(s.id)).map((s) => s.id));
  const seen = new Set();

  for (const pkg of packages ?? []) {
    if (seen.has(pkg.id)) continue;
    seen.add(pkg.id);

    const schoolIds = (pkg.schoolIds ?? []).filter((id) => visibleIds.has(id));
    if (!schoolIds.length || pkg.center?.lat == null) continue;

    const marker = Leaflet.marker([pkg.center.lat, pkg.center.lng], {
      icon: createEpciHubIcon(schoolIds.length, pkg.nomEpci),
      pane: 'school-markers',
    });
    marker.on('click', () => onHubClick?.(pkg));
    root.addLayer(marker);
  }

  // Écoles hors contour EPCI (solo / commune isolée)
  const covered = new Set();
  for (const pkg of packages ?? []) {
    for (const id of pkg.schoolIds ?? []) covered.add(id);
  }

  const orphans = schools.filter((s) => visibleIds.has(s.id) && !covered.has(s.id));
  if (orphans.length) {
    const byCommune = new Map();
    for (const s of orphans) {
      const key = s.codeInsee ?? s.id;
      if (!byCommune.has(key)) byCommune.set(key, []);
      byCommune.get(key).push(s);
    }
    for (const [, list] of byCommune) {
      const lat = list.reduce((sum, s) => sum + s.lat, 0) / list.length;
      const lon = list.reduce((sum, s) => sum + s.lon, 0) / list.length;
      const marker = Leaflet.marker([lat, lon], {
        icon: createEpciHubIcon(list.length, list[0]?.commune ?? 'Commune'),
        pane: 'school-markers',
      });
      marker.on('click', () => {
        if (list.length === 1) onHubClick?.({ schoolIds: [list[0].id], singleSchool: list[0].id });
      });
      root.addLayer(marker);
    }
  }

  return root;
}

/** @deprecated — conservé pour compat ; préférer createEpciPartitionedClusterLayer */
export function createSchoolClusterGroup() {
  return createEpciClusterGroup('legacy', null);
}
