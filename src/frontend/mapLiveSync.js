/** Sync pipeline live — détecte les nouvelles écoles sans reload brutal */

export function collectSchoolIds(data) {
  return new Set((data?.schools ?? []).map((s) => s.id));
}

export function findNewSchoolIds(prevIds, nextSchools) {
  const out = [];
  for (const s of nextSchools ?? []) {
    if (!prevIds.has(s.id)) out.push(s.id);
  }
  return out;
}

export function pulseSchoolMarker(markersById, id, { durationMs = 4000 } = {}) {
  const marker = markersById?.[id];
  const el = marker?.getElement?.()?.querySelector('.marker-zen');
  if (!el) return;
  el.classList.add('marker-zen-new');
  setTimeout(() => el.classList.remove('marker-zen-new'), durationMs);
}

export function pulseSchoolMarkers(markersById, ids, options) {
  for (const id of ids ?? []) {
    pulseSchoolMarker(markersById, id, options);
  }
}
