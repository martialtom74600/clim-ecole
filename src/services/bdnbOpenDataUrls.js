/**
 * URLs des exports CSV BDNB open-data (bucket Scaleway, index data.gouv.fr).
 * Millésime configurable via BDNB_MILLESIME (défaut 2026-02-a).
 */

const S3_BASE = 'https://open-data.s3.fr-par.scw.cloud';

/** Code département config (001, 069, 2A…) → slug S3 (dep01, dep69, dep2a) */
export function bdnbDeptSlug(code) {
  const raw = String(code ?? '').trim().toUpperCase();
  if (raw === '2A' || raw === '2B') {
    return `dep${raw.toLowerCase()}`;
  }
  const n = Number(raw);
  if (Number.isNaN(n)) {
    return `dep${raw}`;
  }
  return `dep${String(n).padStart(2, '0')}`;
}

export function buildBdnbDeptCsvZipUrl(departement, millesime = '2026-02-a') {
  const slug = bdnbDeptSlug(departement);
  const folder = `millesime_${millesime}_${slug}`;
  const file = `open_data_millesime_${millesime}_${slug}_csv.zip`;
  return `${S3_BASE}/bdnb_millesime_${millesime}/${folder}/${file}`;
}

export function buildBdnbFranceCsvTarUrl(millesime = '2026-02-a') {
  return `${S3_BASE}/bdnb_millesime_${millesime}/millesime_${millesime}_france/open_data_millesime_${millesime}_france_csv.tar.gz`;
}

/** Résout le millésime depuis l’API data.gouv (ressource CSV France). */
export async function resolveLatestBdnbMillesime() {
  const res = await fetch(
    'https://www.data.gouv.fr/api/1/datasets/base-de-donnees-nationale-des-batiments/',
    { headers: { 'User-Agent': 'clim-ecole-prospection/1.0' } },
  );
  if (!res.ok) {
    throw new Error(`data.gouv.fr indisponible (${res.status})`);
  }
  const data = await res.json();
  const france = (data.resources ?? []).find((r) =>
    String(r.title ?? '').toLowerCase().includes('export france') &&
    String(r.title ?? '').toLowerCase().includes('csv'),
  );
  const url = france?.url ?? '';
  const match = url.match(/bdnb_millesime_([\d]{4}-[\d]{2}-[a-z])/i);
  if (match) {
    return match[1];
  }
  throw new Error('Millésime BDNB introuvable sur data.gouv.fr');
}
