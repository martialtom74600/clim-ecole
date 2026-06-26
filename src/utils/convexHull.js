/** Enveloppe convexe (monotone chain) — fallback si contour EPCI indisponible. */
export function convexHull(points) {
  const pts = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (pts.length <= 2) return pts;

  const sorted = [...pts].sort((a, b) => (a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng));

  const cross = (o, a, b) => (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);

  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

/** Je gonfle une enveloppe depuis son centroïde pour une « bulle » lisible. */
export function expandHull(hull, factor = 1.18) {
  if (hull.length < 3) return hull;
  const center = hull.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  center.lat /= hull.length;
  center.lng /= hull.length;

  return hull.map((p) => ({
    lat: center.lat + (p.lat - center.lat) * factor,
    lng: center.lng + (p.lng - center.lng) * factor,
  }));
}
