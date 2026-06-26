/** Heatmap score closing — cercles proportionnels (sans dépendance externe) */

const Leaflet = typeof L !== 'undefined' ? L : window.L;

export function buildClosingHeatLayer(schools, visibleFn) {
  const group = Leaflet.layerGroup();

  for (const s of schools ?? []) {
    if (!visibleFn(s.id)) continue;
    const score = Number(s.scoreClosing ?? 0);
    if (score <= 0) continue;

    const t = score / 100;
    const radius = 600 + t * 1800;
    const hot = score >= 75;

    Leaflet.circle([s.lat, s.lon], {
      radius,
      stroke: false,
      fillColor: hot ? '#fb923c' : '#14b8a6',
      fillOpacity: 0.04 + t * 0.14,
      interactive: false,
      pane: 'heatmap',
    }).addTo(group);
  }

  return group;
}
