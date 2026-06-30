/**
 * Sync signaux AO BOAMP → territory_tender_signals (cron hebdo).
 * Usage: node src/scripts/syncBoampTenders.js
 */
import dotenv from 'dotenv';
import { requireSupabaseFromEnv } from '../lib/supabaseNode.js';

dotenv.config();

const BOAMP_URL =
  'https://opendata.boamp.fr/api/explore/v2.1/catalog/datasets/boamp/records';

const KEYWORDS = [
  'rénovation énergétique',
  'rénovation energetique',
  'école',
  'ecole',
  'bâtiment',
  'chauffage',
  'MGPE',
  'performance énergétique',
];

function supabase() {
  return requireSupabaseFromEnv();
}

function matchesKeywords(text) {
  const lower = (text ?? '').toLowerCase();
  return KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
}

async function fetchBoampRecords(limit = 50) {
  const params = new URLSearchParams({
    limit: String(limit),
    order_by: 'dateparution desc',
    where: "statut='En cours' OR statut='Publié'",
  });

  const res = await fetch(`${BOAMP_URL}?${params}`);
  if (!res.ok) throw new Error(`BOAMP HTTP ${res.status}`);
  const json = await res.json();
  return json.results ?? [];
}

async function loadCommuneIndex(sb) {
  const { data } = await sb.from('communes').select('nom, departement, epci_id');
  const { data: epciRows } = await sb.from('epci').select('id, code_epci');
  const epciById = new Map((epciRows ?? []).map((e) => [e.id, e.code_epci]));

  const index = new Map();
  for (const c of data ?? []) {
    const codeEpci = epciById.get(c.epci_id);
    if (!codeEpci) continue;
    const key = `${(c.nom ?? '').toLowerCase()}|${c.departement ?? ''}`;
    if (!index.has(key)) index.set(key, codeEpci);
  }
  return index;
}

function guessCodeEpci(record, communeIndex) {
  const dept = record.code_departement ?? record.departement ?? '';
  const commune = (record.commune ?? record.lieu ?? '').toLowerCase().trim();
  if (commune) {
    const hit = communeIndex.get(`${commune}|${dept}`);
    if (hit) return hit;
  }
  return null;
}

async function main() {
  const sb = supabase();
  const records = await fetchBoampRecords(100);
  const communeIndex = await loadCommuneIndex(sb);

  let upserted = 0;
  let skipped = 0;

  for (const rec of records) {
    const title = rec.objet ?? rec.titre ?? '';
    const desc = rec.descripteur ?? rec.description ?? '';
    if (!matchesKeywords(`${title} ${desc}`)) {
      skipped += 1;
      continue;
    }

    const codeEpci = guessCodeEpci(rec, communeIndex);
    if (!codeEpci) {
      skipped += 1;
      continue;
    }

    const { error } = await sb.from('territory_tender_signals').upsert(
      {
        code_epci: codeEpci,
        has_active_tender: true,
        tender_title: title.slice(0, 500),
        tender_source: 'BOAMP',
        tender_url: rec.url_avis ?? rec.lien ?? null,
        detected_at: rec.dateparution ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'code_epci' },
    );

    if (!error) upserted += 1;
    else console.warn('[boamp] upsert error:', error.message);
  }

  console.log(`[boamp] ${records.length} avis scannés, ${upserted} signaux upsertés, ${skipped} ignorés`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
