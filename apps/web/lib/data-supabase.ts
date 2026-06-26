import { mapCsvRecordToProspectRow } from './data-csv';
import { getSupabaseServer } from './supabase-server';
import type { ProspectionDataset, ProspectRow } from './types';

const PAGE_SIZE = 500;

type SupabaseBatimentRow = {
  code_uai: string;
  code_insee: string;
  nom: string;
  type_usage: string | null;
  surface_m2: number | null;
  dpe_lettre: string | null;
  annee_construction: number | null;
  latitude: number | null;
  longitude: number | null;
  proprietaire_ffo_forme: string | null;
  proprietaire_ffo_denomination: string | null;
  financement_statut: string | null;
  package_id: string | null;
  statut_projet_epci: string | null;
  capex_total: number | null;
  part_fonds_euros: number | null;
  gain_net_mairie_euros: number | null;
  score_eligibilite_closing: number | null;
  temperature_lead: string | null;
  finance_json: Record<string, unknown> | null;
  technique_json: Record<string, unknown> | null;
  synced_at: string;
  communes: {
    code_insee: string;
    nom: string;
    email_mairie: string | null;
    epci: { code_epci: string; nom: string };
  };
  batiment_artisans: {
    distance_km: number | null;
    effectif_label: string | null;
    effectif_min: number | null;
    is_primary: boolean;
    artisans: {
      nom: string;
      email: string | null;
      tranche_effectif: string | null;
      effectif_label: string | null;
      effectif_min: number | null;
    } | null;
  }[];
};

function temperatureToClosingLabel(t: string | null | undefined): string {
  switch (t) {
    case 'chaud':
      return '🔥 Chaud';
    case 'tiède':
      return '⚡ Tiède';
    case 'froid':
      return '❄ Froid';
    default:
      return t ?? '';
  }
}

function jsonToCsvFields(json: Record<string, unknown> | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!json) return out;
  for (const [key, value] of Object.entries(json)) {
    if (value == null) continue;
    out[key] = String(value);
  }
  return out;
}

function normalizeBatimentRow(raw: Record<string, unknown>): SupabaseBatimentRow {
  const communeRaw = raw.communes;
  const commune = (Array.isArray(communeRaw) ? communeRaw[0] : communeRaw) as SupabaseBatimentRow['communes'] | undefined;
  if (!commune) {
    throw new Error(`Bâtiment ${raw.code_uai}: commune manquante`);
  }
  const epciRaw = commune.epci;
  const epci = (Array.isArray(epciRaw) ? epciRaw[0] : epciRaw) as SupabaseBatimentRow['communes']['epci'];
  return {
    ...(raw as SupabaseBatimentRow),
    communes: { ...commune, epci },
  };
}

function toCsvRecord(row: SupabaseBatimentRow): Record<string, string> {
  const commune = row.communes;
  const epci = commune.epci;
  const links = row.batiment_artisans ?? [];
  const primary = links.find((l) => l.is_primary) ?? links[0];
  const artisan = primary?.artisans;

  return {
    ...jsonToCsvFields(row.finance_json),
    ...jsonToCsvFields(row.technique_json),
    Code_UAI: row.code_uai,
    Code_INSEE: commune.code_insee,
    Code_EPCI: epci.code_epci,
    Nom_EPCI: epci.nom,
    Nom_Ecole: row.nom,
    Type_Patrimoine: row.type_usage ?? '',
    Commune: commune.nom,
    Surface_M2: row.surface_m2 != null ? String(row.surface_m2) : '',
    Annee_Construction: row.annee_construction != null ? String(row.annee_construction) : '',
    Classe_DPE: row.dpe_lettre ?? '',
    Proprietaire_FFO_Forme: row.proprietaire_ffo_forme ?? '',
    Proprietaire_FFO_Denomination: row.proprietaire_ffo_denomination ?? '',
    Financement_Statut: row.financement_statut ?? '',
    Statut_Projet_EPCI: row.statut_projet_epci ?? '',
    Package_ID: row.package_id ?? '',
    CAPEX_Total: row.capex_total != null ? String(row.capex_total) : '',
    Part_Fonds_Euros: row.part_fonds_euros != null ? String(row.part_fonds_euros) : '',
    Gain_Net_Annuel_Mairie_Euros:
      row.gain_net_mairie_euros != null ? String(row.gain_net_mairie_euros) : '',
    Score_Eligibilite_Closing:
      row.score_eligibilite_closing != null ? String(row.score_eligibilite_closing) : '',
    Closing_Temperature: temperatureToClosingLabel(row.temperature_lead),
    Email_Mairie: commune.email_mairie ?? '',
    Latitude: row.latitude != null ? String(row.latitude) : '',
    Longitude: row.longitude != null ? String(row.longitude) : '',
    Artisan_Nom: artisan?.nom ?? '',
    Artisan_Email: artisan?.email ?? '',
    Artisan_Tranche_Effectif: artisan?.tranche_effectif ?? '',
    Artisan_Effectif_Label: primary?.effectif_label ?? artisan?.effectif_label ?? '',
    Artisan_Effectif_Min:
      (primary?.effectif_min ?? artisan?.effectif_min) != null
        ? String(primary?.effectif_min ?? artisan?.effectif_min)
        : '',
    Artisan_Distance_KM: primary?.distance_km != null ? String(primary.distance_km) : '',
  };
}

const BATIMENT_SELECT = `
  code_uai,
  code_insee,
  nom,
  type_usage,
  surface_m2,
  dpe_lettre,
  annee_construction,
  latitude,
  longitude,
  proprietaire_ffo_forme,
  proprietaire_ffo_denomination,
  financement_statut,
  package_id,
  statut_projet_epci,
  capex_total,
  part_fonds_euros,
  gain_net_mairie_euros,
  score_eligibilite_closing,
  temperature_lead,
  finance_json,
  technique_json,
  synced_at,
  communes!inner (
    code_insee,
    nom,
    email_mairie,
    epci!inner (code_epci, nom)
  ),
  batiment_artisans (
    distance_km,
    effectif_label,
    effectif_min,
    is_primary,
    artisans (nom, email, tranche_effectif, effectif_label, effectif_min)
  )
`;

export async function loadProspectionFromSupabase(): Promise<ProspectionDataset> {
  const supabase = getSupabaseServer();
  const rows: ProspectRow[] = [];
  let latestSyncMs = 0;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('batiments')
      .select(BATIMENT_SELECT)
      .is('blacklisted_at', null)
      .order('code_uai')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Supabase batiments: ${error.message}`);
    }

    const batch = (data ?? []).map((row) => normalizeBatimentRow(row as Record<string, unknown>));
    if (!batch.length) break;

    for (const row of batch) {
      rows.push(mapCsvRecordToProspectRow(toCsvRecord(row)));
      const synced = Date.parse(row.synced_at);
      if (Number.isFinite(synced) && synced > latestSyncMs) {
        latestSyncMs = synced;
      }
    }

    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return {
    meta: {
      filePath: 'supabase',
      rowCount: rows.length,
      loadedAt: new Date().toISOString(),
      fileMtimeMs: latestSyncMs,
    },
    rows,
  };
}
