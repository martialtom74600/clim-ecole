/** Recherche carte — suggestions, stats filtres */

import { rowMatchesQuickFilter } from './focusPanel.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function haystack(row) {
  return [
    row.Nom_Ecole, row.Commune, row.Code_UAI, row.Code_INSEE,
    row.Proprietaire_FFO_Denomination, row.Nom_EPCI,
  ].join(' ').toLowerCase();
}

export function getMapFilterStats(state) {
  const rows = state.dashboardData?.schools ?? [];
  const filtered = rows.filter((r) => rowMatchesQuickFilter(r, state.mapFilter));
  const q = String(state.searchQuery ?? '').trim().toLowerCase();
  const searched = q
    ? filtered.filter((r) => haystack(r).includes(q))
    : filtered;

  const capex = searched.reduce((s, r) => s + (r.CAPEX_Total ?? 0), 0);
  const hot = searched.filter((r) => (r.Score_Eligibilite_Closing ?? 0) >= 75).length;

  return {
    total: rows.length,
    filtered: filtered.length,
    shown: searched.length,
    capex,
    hot,
  };
}

export function buildSearchSuggestions(state, limit = 8) {
  const q = String(state.searchQuery ?? '').trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const rows = (state.dashboardData?.schools ?? [])
    .filter((r) => rowMatchesQuickFilter(r, state.mapFilter))
    .filter((r) => haystack(r).includes(q));

  const communes = new Map();
  const schools = [];

  for (const row of rows) {
    schools.push({
      kind: 'school',
      id: row.Code_UAI,
      title: row.Nom_Ecole,
      sub: `${row.Commune} · ${row.Classe_DPE ?? '—'} · ${fmtCompact(row.CAPEX_Total)}`,
      lat: row.Latitude,
      lon: row.Longitude,
    });
    const insee = String(row.Code_INSEE ?? '');
    if (insee && !communes.has(insee)) {
      communes.set(insee, {
        kind: 'commune',
        id: insee,
        title: row.Commune,
        sub: `INSEE ${insee}`,
        lat: row.Latitude,
        lon: row.Longitude,
      });
    }
  }

  const out = [];
  for (const c of communes.values()) {
    if (c.title?.toLowerCase().includes(q)) out.push(c);
  }
  for (const s of schools) {
    out.push(s);
    if (out.length >= limit) break;
  }
  return out.slice(0, limit);
}

function fmtCompact(n) {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `${(v / 1e6).toFixed(1).replace('.0', '')} M€`;
  if (v >= 1000) return `${Math.round(v / 1000)} k€`;
  return `${Math.round(v)} €`;
}

export function buildSearchDropdownHtml(items, activeIndex = 0) {
  if (!items.length) {
    return '<p class="zen-search-empty">Aucun résultat</p>';
  }
  return items.map((item, i) => {
    const icon = item.kind === 'commune' ? '🏛' : '🏫';
    return `<button type="button" class="zen-search-hit${i === activeIndex ? ' is-active' : ''}"
      data-hit-kind="${esc(item.kind)}" data-hit-id="${esc(item.id)}"
      data-hit-lat="${item.lat ?? ''}" data-hit-lon="${item.lon ?? ''}">
      <span class="zen-search-hit-icon">${icon}</span>
      <span class="zen-search-hit-body">
        <span class="zen-search-hit-title">${esc(item.title)}</span>
        <span class="zen-search-hit-sub">${esc(item.sub)}</span>
      </span>
    </button>`;
  }).join('');
}

export function getVisibleSchoolIdsPerPackage(state) {
  const visible = new Set(getFilteredSchoolIdsFromState(state));
  const map = new Map();
  for (const pkg of state.data?.packages ?? []) {
    const count = (pkg.schoolIds ?? []).filter((id) => visible.has(id)).length;
    map.set(pkg.id, count);
  }
  return map;
}

function getFilteredSchoolIdsFromState(state) {
  const q = String(state.searchQuery ?? '').trim().toLowerCase();
  return (state.dashboardData?.schools ?? [])
    .filter((r) => rowMatchesQuickFilter(r, state.mapFilter))
    .filter((r) => !q || haystack(r).includes(q))
    .map((r) => r.Code_UAI);
}

export { getFilteredSchoolIdsFromState as getFilteredSchoolIdsForMap };

/** Vol carte vers un résultat de recherche (commune = fitBounds des écoles). */
export function flyToSearchHit(map, hit, schools = []) {
  if (!map || !hit) return;

  if (hit.kind === 'commune') {
    const insee = String(hit.id ?? '');
    const pts = (schools ?? [])
      .filter((s) => String(s.codeInsee ?? s.Code_INSEE ?? '') === insee)
      .filter((s) => s.lat != null && s.lon != null)
      .map((s) => [s.lat, s.lon]);
    if (pts.length >= 2) {
      map.fitBounds(pts, { padding: [80, 80], maxZoom: 12, duration: 0.55 });
      return;
    }
    if (pts.length === 1) {
      map.flyTo(pts[0], 13, { duration: 0.5 });
      return;
    }
  }

  const node = (schools ?? []).find((s) => s.id === hit.id);
  const lat = node?.lat ?? Number(hit.lat);
  const lon = node?.lon ?? Number(hit.lon);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    map.flyTo([lat, lon], 13, { duration: 0.5 });
  }
}
