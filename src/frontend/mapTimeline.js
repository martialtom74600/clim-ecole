/** Timeline chantier EPCI — périodes idéales sur la carte */

const Leaflet = typeof L !== 'undefined' ? L : window.L;

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function shortenPeriod(label) {
  const s = String(label ?? '').trim();
  if (!s) return 'Vacances scolaires';
  if (s.length <= 28) return s;
  return `${s.slice(0, 26)}…`;
}

function dominantPeriod(schools) {
  const counts = new Map();
  for (const s of schools) {
    const p = String(s.periodeChantier ?? s.Periode_Ideale_Chantier ?? '').trim();
    if (!p) continue;
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  if (!counts.size) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function buildEpciTimelineLayer(packages, schools, visibleFn, { minZoom = 9 } = {}) {
  const group = Leaflet.layerGroup();
  const schoolById = new Map((schools ?? []).map((s) => [s.id, s]));

  for (const pkg of packages ?? []) {
    const visibleSchools = (pkg.schoolIds ?? [])
      .filter(visibleFn)
      .map((id) => schoolById.get(id))
      .filter(Boolean);
    if (!visibleSchools.length || pkg.center?.lat == null) continue;

    const period = dominantPeriod(visibleSchools);
    const duree = visibleSchools.reduce((m, s) => Math.max(m, Number(s.dureeSemaines ?? s.Duree_Estimee_Semaines ?? 0)), 0);
    const label = shortenPeriod(period);
    const tip = period
      ? `${pkg.nomEpci ?? pkg.id}<br>${period}${duree ? `<br>${duree} sem.` : ''}`
      : `${pkg.nomEpci ?? pkg.id}<br>Période non renseignée`;

    const icon = Leaflet.divIcon({
      className: '',
      html: `<div class="marker-timeline"><span class="marker-timeline-icon">📅</span><span>${esc(label)}</span></div>`,
      iconSize: [140, 28],
      iconAnchor: [70, 14],
    });

    const marker = Leaflet.marker([pkg.center.lat, pkg.center.lng], {
      icon,
      pane: 'timeline-labels',
      interactive: true,
    });
    marker.bindTooltip(tip, {
      direction: 'top',
      className: 'epci-tooltip',
      opacity: 0.95,
    });
    marker._minZoom = minZoom;
    group.addLayer(marker);
  }

  return group;
}

export function syncTimelineVisibility(layer, map) {
  if (!layer || !map) return;
  const zoom = map.getZoom();
  layer.eachLayer((m) => {
    const el = m.getElement?.();
    if (el) {
      el.style.display = zoom >= (m._minZoom ?? 9) ? '' : 'none';
    }
  });
}
