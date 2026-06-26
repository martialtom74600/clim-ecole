/* Marqueurs sémantiques — DPE, statut financement, score closing */

import { schoolRingColor } from './mapStyle.js';

const Leaflet = typeof L !== 'undefined' ? L : window.L;

function markerSize(tier, { highlighted, hot, largeCapex }) {
  if (highlighted) return 14;
  if (hot) return 11;
  if (largeCapex) return 10;
  if (tier === 'overview') return 8;
  return 9;
}

export function createSchoolIcon(school, tier, { highlighted = false } = {}) {
  const ring = schoolRingColor(school?.financement);
  const dpe = String(school?.classeDpe ?? '').toUpperCase().charAt(0) || '·';
  const fill = school?.dpeColor ?? '#94a3b8';
  const hot = (school?.scoreClosing ?? 0) >= 75;
  const largeCapex = (school?.capex ?? 0) >= 1_000_000;
  const sz = markerSize(tier, { highlighted, hot, largeCapex });
  const hl = highlighted ? ' marker-zen-hl' : '';
  const hotCls = hot ? ' marker-zen-hot' : '';
  const dpeLabel = sz >= 10 ? `<span class="marker-zen-dpe">${dpe}</span>` : '';

  return Leaflet.divIcon({
    className: '',
    html: `<div class="marker-zen${hl}${hotCls}" style="--sz:${sz}px;--ring:${ring};--fill:${fill}">${dpeLabel}</div>`,
    iconSize: [sz + 6, sz + 6],
    iconAnchor: [(sz + 6) / 2, (sz + 6) / 2],
  });
}

export function createMairieIcon({ highlighted = false } = {}) {
  const sz = highlighted ? 28 : 24;
  return Leaflet.divIcon({
    className: '',
    html: `<div class="marker-mairie${highlighted ? ' is-hl' : ''}">🏛</div>`,
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
  });
}

export function createArtisanIcon({ highlighted = false, approximate = false } = {}) {
  const sz = highlighted ? 26 : 22;
  return Leaflet.divIcon({
    className: '',
    html: `<div class="marker-artisan${highlighted ? ' is-hl' : ''}${approximate ? ' is-approx' : ''}">🔧</div>`,
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
  });
}

export function createEpciLabelIcon() {
  return Leaflet.divIcon({
    className: '',
    html: '',
    iconSize: [0, 0],
  });
}
