/** Je convertis des coordonnées Lambert-93 (EPSG:2154) en WGS84 pour le géocodage artisan. */
export function lambert93ToWgs84(x, y) {
  const rad = Math.PI / 180;
  const c = 11754255.426096;
  const e = 0.08181919106;
  const n = 0.7256077650;
  const xs = 700000.0;
  const ys = 12655612.049876;
  const l0 = 3.0 * rad;

  const dx = x - xs;
  const dy = ys - y;
  const R = Math.hypot(dx, dy);
  const gamma = Math.atan2(dx, dy);
  const lon = gamma / n + l0;

  const latIso = -Math.log(R / c) / n;
  let phi = 2 * Math.atan(Math.exp(latIso)) - Math.PI / 2;
  for (let i = 0; i < 15; i += 1) {
    const es = e * Math.sin(phi);
    const latIsoCalc = Math.log(
      Math.tan(Math.PI / 4 + phi / 2) * ((1 - es) / (1 + es)) ** (e / 2),
    );
    const f = latIsoCalc - latIso;
    phi -= (f * Math.cos(phi) * (1 - es * es)) / (1 - es * es * Math.sin(phi) ** 2);
  }

  return { lat: phi / rad, lon: lon / rad };
}

/** Je parse un WKT POINT Lambert-93 (BDNB) en latitude/longitude WGS84. */
export function parseLambertWktPoint(wkt) {
  const match = String(wkt ?? '').match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!match) {
    return { lat: null, lon: null };
  }
  const x = Number(match[1]);
  const y = Number(match[2]);
  if (Number.isNaN(x) || Number.isNaN(y)) {
    return { lat: null, lon: null };
  }
  return lambert93ToWgs84(x, y);
}
