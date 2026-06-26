import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { config } from '../config.js';
import { getDepartmentEntry } from '../data/franceDepartments.js';

dotenv.config();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function parseCliArgs() {
  const args = process.argv.slice(2);
  const out = {
    file: process.env.OUTPUT_FILE ?? 'output_prospection.csv',
    regionLabel: process.env.REGION_LABEL?.trim() || 'Auvergne-Rhône-Alpes',
    department: process.env.SYNC_DEPARTMENT?.trim() || null,
    skipIfEmpty: false,
    gitCommit: process.env.GITHUB_SHA?.trim() || null,
  };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--file') out.file = args[++i];
    else if (args[i] === '--region-label') out.regionLabel = args[++i];
    else if (args[i] === '--department') out.department = args[++i];
    else if (args[i] === '--skip-if-empty') out.skipIfEmpty = true;
    else if (args[i] === '--git-commit') out.gitCommit = args[++i];
  }
  if (!path.isAbsolute(out.file)) {
    out.file = path.resolve(root, out.file);
  }
  return out;
}

const BATCH_SIZE = Number(process.env.SUPABASE_SYNC_BATCH_SIZE ?? 100);

const FINANCE_PREFIXES = [
  'CAPEX_',
  'MGPE_',
  'Fonds_',
  'Economie_',
  'Subventions_',
  'CEE_',
  'Part_Fonds_',
  'Pack_',
  'Gain_Net_',
  'Facture_',
  'Conso_',
  'Taux_',
];
const FINANCE_EXACT = new Set([
  'Modele_Financement',
  'Financement_Statut',
  'Statut_Projet_EPCI',
  'Package_ID',
  'Argumentaire_Loi_ELAN',
  'Argumentaire_MGPE_PD',
  'Alerte_Financement',
]);

const TECHNIQUE_FIELDS = new Set([
  'Type_Travaux',
  'Puissance_PAC_kW',
  'Ouvriers_Requis',
  'Duree_Estimee_Semaines',
  'Periode_Ideale_Chantier',
  'Ratio_PAC_W_M2',
  'Alerte_Surdimensionnement',
  'Alerte_Surdimensionnement_Note',
  'Statut_DPE',
  'Annee_DPE',
]);

const BATIMENT_SCALAR = new Set([
  'Code_UAI',
  'Nom_Ecole',
  'Type_Patrimoine',
  'Surface_M2',
  'Classe_DPE',
  'Annee_Construction',
  'Closing_Temperature',
  'Score_Eligibilite_Closing',
  'Code_INSEE',
  'Code_EPCI',
  'Nom_EPCI',
  'Commune',
  'Email_Mairie',
  'Latitude',
  'Longitude',
  'Proprietaire_FFO_Forme',
  'Proprietaire_FFO_Denomination',
  'Financement_Statut',
  'Package_ID',
  'Statut_Projet_EPCI',
  'CAPEX_Total',
  'Part_Fonds_Euros',
  'Gain_Net_Annuel_Mairie_Euros',
  'Artisan_Nom',
  'Artisan_Email',
  'Artisan_Tranche_Effectif',
  'Artisan_Distance_KM',
  'Artisan_Effectif_Label',
  'Artisan_Effectif_Min',
]);

function deterministicUuid(scope, key) {
  const hash = createHash('sha256').update(`${scope}:${key}`).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function parseNum(value) {
  if (value == null || value === '') return null;
  const parsed = Number(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIntVal(value) {
  const n = parseNum(value);
  return n == null ? null : Math.round(n);
}

function cleanStr(value) {
  const s = String(value ?? '').trim();
  return s || null;
}

function padInsee(code) {
  const raw = String(code ?? '').trim();
  if (!raw) return null;
  return raw.padStart(5, '0');
}

function departementFromInsee(codeInsee) {
  if (!codeInsee) return null;
  if (codeInsee.startsWith('97') || codeInsee.startsWith('98')) {
    return codeInsee.slice(0, 3);
  }
  return codeInsee.replace(/^0+/, '').slice(0, 2) || codeInsee.slice(0, 2);
}

function parseTemperatureLead(closingTemperature) {
  const t = String(closingTemperature ?? '').toLowerCase();
  if (t.includes('chaud') || t.includes('🔥')) return 'chaud';
  if (t.includes('tiède') || t.includes('tiede') || t.includes('⚡')) return 'tiède';
  if (t.includes('froid') || t.includes('❄')) return 'froid';
  return null;
}

function isFinanceField(key) {
  if (FINANCE_EXACT.has(key)) return true;
  return FINANCE_PREFIXES.some((p) => key.startsWith(p));
}

function pickJson(row, predicate) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (!predicate(key) || BATIMENT_SCALAR.has(key)) continue;
    if (value == null || value === '') continue;
    out[key] = value;
  }
  return out;
}

function expandBlacklistId(id) {
  const out = new Set();
  const v = String(id ?? '').trim();
  if (!v) return out;
  out.add(v);
  if (v.startsWith('BDNB-')) out.add(v.slice(5));
  if (!v.startsWith('BDNB-')) out.add(`BDNB-${v}`);
  return out;
}

function isBlacklisted(codeUai, blacklistSet) {
  for (const id of expandBlacklistId(codeUai)) {
    if (blacklistSet.has(id)) return true;
  }
  return false;
}

async function loadPopulationMap() {
  const file = path.join(config.cacheDir ?? '.cache', 'population-by-insee.json');
  try {
    const raw = JSON.parse(await fs.readFile(file, 'utf8'));
    const map = new Map();
    for (const [k, v] of Object.entries(raw)) {
      map.set(padInsee(k), Number(v));
    }
    return map;
  } catch {
    return new Map();
  }
}

async function loadBlacklistIds() {
  const file = path.isAbsolute(config.blacklistFile)
    ? config.blacklistFile
    : path.resolve(process.cwd(), config.blacklistFile ?? 'data/blacklist.json');
  try {
    const raw = JSON.parse(await fs.readFile(file, 'utf8'));
    return (Array.isArray(raw?.ids) ? raw.ids : []).map((id) => String(id).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function readCsv(filePath) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  const content = await fs.readFile(absolute, 'utf8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
  });
}

async function upsertBatches(supabase, table, rows, { onConflict, label }) {
  if (!rows.length) return 0;
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table} batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
    done += batch.length;
    process.stdout.write(`\r  ${label}: ${done}/${rows.length}`);
  }
  process.stdout.write('\n');
  return done;
}

function buildEpciRows(rows, regionLabel) {
  const map = new Map();
  for (const row of rows) {
    const code = cleanStr(row.Code_EPCI);
    if (!code) continue;
    map.set(code, {
      id: deterministicUuid('epci', code),
      code_epci: code,
      nom: cleanStr(row.Nom_EPCI) ?? code,
      region: regionLabel,
      updated_at: new Date().toISOString(),
    });
  }
  return [...map.values()];
}

function buildCommuneRows(rows, populationMap) {
  const map = new Map();
  for (const row of rows) {
    const codeInsee = padInsee(row.Code_INSEE);
    const codeEpci = cleanStr(row.Code_EPCI);
    if (!codeInsee || !codeEpci) continue;

    const existing = map.get(codeInsee);
    const email = cleanStr(row.Email_Mairie);
    map.set(codeInsee, {
      code_insee: codeInsee,
      nom: cleanStr(row.Commune) ?? codeInsee,
      population: populationMap.get(codeInsee) ?? existing?.population ?? null,
      departement: departementFromInsee(codeInsee),
      epci_id: deterministicUuid('epci', codeEpci),
      email_mairie: email ?? existing?.email_mairie ?? null,
      updated_at: new Date().toISOString(),
    });
  }
  return [...map.values()];
}

function buildArtisanRows(rows) {
  const map = new Map();
  for (const row of rows) {
    const nom = cleanStr(row.Artisan_Nom);
    if (!nom) continue;
    const email = cleanStr(row.Artisan_Email) ?? '';
    const key = `${nom.toLowerCase()}|${email.toLowerCase()}`;
    map.set(key, {
      id: deterministicUuid('artisan', key),
      nom,
      email: email || null,
      tranche_effectif: cleanStr(row.Artisan_Tranche_Effectif),
      effectif_label: cleanStr(row.Artisan_Effectif_Label),
      effectif_min: parseIntVal(row.Artisan_Effectif_Min),
      updated_at: new Date().toISOString(),
    });
  }
  return [...map.values()];
}

function buildBatimentPayload(rows, blacklistSet) {
  const now = new Date().toISOString();
  return rows
    .map((row) => {
      const codeUai = cleanStr(row.Code_UAI);
      const codeInsee = padInsee(row.Code_INSEE);
      if (!codeUai || !codeInsee) return null;

      const artisanNom = cleanStr(row.Artisan_Nom);
      const artisanEmail = cleanStr(row.Artisan_Email) ?? '';
      const artisanKey = artisanNom ? `${artisanNom.toLowerCase()}|${artisanEmail.toLowerCase()}` : null;
      const blacklisted = isBlacklisted(codeUai, blacklistSet);

      return {
        batiment: {
          id: deterministicUuid('batiment', codeUai),
          code_uai: codeUai,
          code_insee: codeInsee,
          nom: cleanStr(row.Nom_Ecole) ?? codeUai,
          type_usage: cleanStr(row.Type_Patrimoine),
          surface_m2: parseNum(row.Surface_M2),
          dpe_lettre: cleanStr(row.Classe_DPE)?.charAt(0)?.toUpperCase() ?? null,
          annee_construction: parseIntVal(row.Annee_Construction),
          latitude: parseNum(row.Latitude),
          longitude: parseNum(row.Longitude),
          proprietaire_ffo_forme: cleanStr(row.Proprietaire_FFO_Forme),
          proprietaire_ffo_denomination: cleanStr(row.Proprietaire_FFO_Denomination),
          financement_statut: cleanStr(row.Financement_Statut),
          package_id: cleanStr(row.Package_ID),
          statut_projet_epci: cleanStr(row.Statut_Projet_EPCI),
          capex_total: parseNum(row.CAPEX_Total),
          part_fonds_euros: parseNum(row.Part_Fonds_Euros),
          gain_net_mairie_euros: parseNum(row.Gain_Net_Annuel_Mairie_Euros),
          score_eligibilite_closing: parseIntVal(row.Score_Eligibilite_Closing),
          temperature_lead: parseTemperatureLead(row.Closing_Temperature),
          blacklisted_at: blacklisted ? now : null,
          finance_json: pickJson(row, isFinanceField),
          technique_json: pickJson(row, (k) => TECHNIQUE_FIELDS.has(k)),
          synced_at: now,
          updated_at: now,
        },
        link: artisanKey
          ? {
              batiment_id: deterministicUuid('batiment', codeUai),
              artisan_id: deterministicUuid('artisan', artisanKey),
              distance_km: parseNum(row.Artisan_Distance_KM),
              is_primary: true,
              effectif_label: cleanStr(row.Artisan_Effectif_Label),
              effectif_min: parseIntVal(row.Artisan_Effectif_Min),
            }
          : null,
      };
    })
    .filter(Boolean);
}

function buildBlacklistRows(ids) {
  return ids.map((identifiant) => ({
    identifiant,
    motif: 'sync pipeline',
  }));
}

function getSupabase() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    ?? process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) {
    throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function updatePipelineJob(supabase, job) {
  const { error } = await supabase.from('pipeline_jobs').upsert(job, { onConflict: 'department_code' });
  if (error && !error.message.includes('schema cache')) {
    console.warn(`[sync] pipeline_jobs: ${error.message}`);
  }
}

export async function syncCsvToSupabase(options) {
  const started = Date.now();
  const csvPath = options.file;
  const regionLabel = options.regionLabel;
  const deptEntry = options.department ? getDepartmentEntry(options.department) : null;

  let rows;
  try {
    rows = await readCsv(csvPath);
  } catch (err) {
    if (err.code === 'ENOENT' && options.skipIfEmpty) {
      console.log(`[sync] Fichier absent ${csvPath} — skip`);
      return { rowCount: 0, skipped: true };
    }
    throw err;
  }

  if (!rows.length && options.skipIfEmpty) {
    console.log(`[sync] CSV vide — skip Supabase`);
    if (options.department && deptEntry) {
      const supabase = getSupabase();
      await updatePipelineJob(supabase, {
        department_code: deptEntry.code,
        department_label: deptEntry.label,
        region_slug: deptEntry.region_slug,
        region_label: deptEntry.region_label,
        status: 'empty',
        row_count: 0,
        last_sync_at: new Date().toISOString(),
        git_commit: options.gitCommit,
      });
    }
    return { rowCount: 0, skipped: true };
  }

  console.log(`[sync] Lecture ${csvPath}…`);
  console.log(`[sync] ${rows.length} lignes CSV — ${regionLabel}`);

  const populationMap = await loadPopulationMap();
  const blacklistIds = await loadBlacklistIds();
  const blacklistSet = new Set(blacklistIds);
  const supabase = getSupabase();

  const epciRows = buildEpciRows(rows, regionLabel);
  console.log(`[sync] Upsert epci (${epciRows.length})…`);
  await upsertBatches(supabase, 'epci', epciRows, { onConflict: 'code_epci', label: 'epci' });

  const communeRows = buildCommuneRows(rows, populationMap);
  console.log(`[sync] Upsert communes (${communeRows.length})…`);
  await upsertBatches(supabase, 'communes', communeRows, { onConflict: 'code_insee', label: 'communes' });

  const artisanRows = buildArtisanRows(rows);
  console.log(`[sync] Upsert artisans (${artisanRows.length})…`);
  await upsertBatches(supabase, 'artisans', artisanRows, { onConflict: 'id', label: 'artisans' });

  const batimentPayload = buildBatimentPayload(rows, blacklistSet);
  const batimentRows = batimentPayload.map((p) => p.batiment);
  const linkRows = batimentPayload.map((p) => p.link).filter(Boolean);

  console.log(`[sync] Upsert batiments (${batimentRows.length})…`);
  await upsertBatches(supabase, 'batiments', batimentRows, { onConflict: 'code_uai', label: 'batiments' });

  console.log(`[sync] Upsert batiment_artisans (${linkRows.length})…`);
  await upsertBatches(supabase, 'batiment_artisans', linkRows, {
    onConflict: 'batiment_id,artisan_id',
    label: 'batiment_artisans',
  });

  if (blacklistIds.length) {
    const blacklistRows = buildBlacklistRows(blacklistIds);
    console.log(`[sync] Upsert blacklist (${blacklistRows.length})…`);
    await upsertBatches(supabase, 'blacklist', blacklistRows, { onConflict: 'identifiant', label: 'blacklist' });
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const blacklistedCount = batimentRows.filter((b) => b.blacklisted_at).length;
  console.log(
    `[sync] Terminée en ${elapsed}s — `
    + `${epciRows.length} EPCI · ${communeRows.length} communes · `
    + `${artisanRows.length} artisans · ${batimentRows.length} bâtiments · `
    + `${linkRows.length} liaisons · ${blacklistedCount} blacklistés`,
  );

  if (options.department && deptEntry) {
    const hash = createHash('sha256').update(JSON.stringify({ path: csvPath, rows: rows.length })).digest('hex');
    await updatePipelineJob(supabase, {
      department_code: deptEntry.code,
      department_label: deptEntry.label,
      region_slug: deptEntry.region_slug,
      region_label: deptEntry.region_label,
      status: 'done',
      row_count: batimentRows.length,
      csv_sha: hash.slice(0, 16),
      last_sync_at: new Date().toISOString(),
      git_commit: options.gitCommit,
    });
  }

  return { rowCount: batimentRows.length, skipped: false };
}

async function main() {
  const cli = parseCliArgs();
  await syncCsvToSupabase({
    file: cli.file,
    regionLabel: cli.regionLabel,
    department: cli.department,
    skipIfEmpty: cli.skipIfEmpty,
    gitCommit: cli.gitCommit,
  });
}

const isDirectRun = process.argv[1]
  && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
if (isDirectRun) {
  main().catch((err) => {
    console.error('[sync] Échec:', err.message);
    process.exit(1);
  });
}
