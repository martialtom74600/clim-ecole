import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import type { ProspectRow, ProspectionDataset } from './types';
import { departementFromInsee } from './geo-france';

const CSV_COLUMNS: Record<string, keyof ProspectRow> = {
  Code_UAI: 'codeUai',
  Code_INSEE: 'codeInsee',
  Code_Departement: 'departement',
  Code_EPCI: 'codeEpci',
  Nom_EPCI: 'nomEpci',
  Nom_Ecole: 'nomEcole',
  Type_Patrimoine: 'typePatrimoine',
  Proprietaire_FFO_Forme: 'proprietaireFfoForme',
  Proprietaire_FFO_Denomination: 'proprietaireFfoDenomination',
  Commune: 'commune',
  Surface_M2: 'surfaceM2',
  Annee_Construction: 'anneeConstruction',
  Statut_DPE: 'statutDpe',
  Annee_DPE: 'anneeDpe',
  Classe_DPE: 'classeDpe',
  Conso_Annuelle_kWh: 'consoAnnuelleKwh',
  Conso_Specifique_kWh_M2: 'consoSpecifiqueKwhM2',
  Facture_Annuelle_Euros: 'factureAnnuelleEuros',
  Economie_Annuelle_Euros: 'economieAnnuelleEuros',
  Economie_Realiste_Euros: 'economieRealisteEuros',
  Economie_Plancher_66pct_Euros: 'economiePlancher66pctEuros',
  Modele_Financement: 'modeleFinancement',
  CAPEX_Total: 'capexTotal',
  CAPEX_HT_Euros: 'capexHtEuros',
  Subventions_Etat_Euros: 'subventionsEtatEuros',
  Subventions_Pessimiste_Euros: 'subventionsPessimisteEuros',
  Subventions_Optimiste_Euros: 'subventionsOptimisteEuros',
  Subventions_Fourchette_Label: 'subventionsFourchetteLabel',
  CEE_Euros: 'ceeEuros',
  Part_Fonds_Euros: 'partFondsEuros',
  Part_Fonds_Pessimiste_Euros: 'partFondsPessimisteEuros',
  Part_Fonds_Optimiste_Euros: 'partFondsOptimisteEuros',
  Pack_CAPEX_Total: 'packCapexTotal',
  Pack_Gain_Net_Pessimiste_Total: 'packGainNetPessimisteTotal',
  Financement_Statut: 'financementStatut',
  Statut_Projet_EPCI: 'statutProjetEpci',
  Package_ID: 'packageId',
  Argumentaire_Loi_ELAN: 'argumentaireLoiElan',
  Argumentaire_MGPE_PD: 'argumentaireMgpePd',
  MGPE_Loyer_Lt_Euros: 'mgpeLoyerLtEuros',
  MGPE_Redevance_Ft_Euros: 'mgpeRedevanceFtEuros',
  MGPE_Part_Services_St_Euros: 'mgpePartServicesStEuros',
  MGPE_Duree_Contrat_Ans: 'mgpeDureeContratAns',
  Gain_Net_Contractuel_Euros: 'gainNetContractuelEuros',
  Gain_Net_Annuel_Mairie_Euros: 'gainNetAnnuelMairieEuros',
  Gain_Net_Pessimiste_Euros: 'gainNetPessimisteEuros',
  Gain_Net_Optimiste_Euros: 'gainNetOptimisteEuros',
  Gain_Net_Fourchette_Label: 'gainNetFourchetteLabel',
  Gain_Net_Plancher_66pct_Euros: 'gainNetPlancher66pctEuros',
  Fonds_ROI_Annees: 'fondsRoiAnnees',
  Fonds_ROI_Pessimiste_Annees: 'fondsRoiPessimisteAnnees',
  Fonds_ROI_Optimiste_Annees: 'fondsRoiOptimisteAnnees',
  Fonds_ROI_Fourchette_Label: 'fondsRoiFourchetteLabel',
  Taux_Subvention_Pessimiste_Pct: 'tauxSubventionPessimistePct',
  Taux_Eco_Realiste_Pessimiste_Pct: 'tauxEcoRealistePessimistePct',
  Ratio_PAC_W_M2: 'ratioPacWM2',
  Alerte_Surdimensionnement: 'alerteSurdimensionnement',
  Alerte_Surdimensionnement_Note: 'alerteSurdimensionnementNote',
  Score_Eligibilite_Closing: 'scoreEligibiliteClosing',
  Closing_Temperature: 'closingTemperature',
  Alerte_Financement: 'alerteFinancement',
  Email_Mairie: 'emailMairie',
  Artisan_Nom: 'artisanNom',
  Artisan_Distance_KM: 'artisanDistanceKm',
  Artisan_Email: 'artisanEmail',
  Artisan_Tranche_Effectif: 'artisanTrancheEffectif',
  Artisan_Effectif_Label: 'artisanEffectifLabel',
  Artisan_Effectif_Min: 'artisanEffectifMin',
  Type_Travaux: 'typeTravaux',
  Puissance_PAC_kW: 'puissancePacKw',
  Ouvriers_Requis: 'ouvriersRequis',
  Duree_Estimee_Semaines: 'dureeEstimeeSemaines',
  Periode_Ideale_Chantier: 'periodeIdealeChantier',
  Latitude: 'latitude',
  Longitude: 'longitude',
};

const NUMERIC_KEYS = new Set<keyof ProspectRow>([
  'surfaceM2', 'anneeConstruction', 'anneeDpe', 'consoAnnuelleKwh', 'consoSpecifiqueKwhM2',
  'factureAnnuelleEuros', 'economieAnnuelleEuros', 'economieRealisteEuros', 'economiePlancher66pctEuros',
  'capexTotal', 'capexHtEuros', 'subventionsEtatEuros', 'subventionsPessimisteEuros', 'subventionsOptimisteEuros',
  'ceeEuros', 'partFondsEuros', 'partFondsPessimisteEuros', 'partFondsOptimisteEuros',
  'packCapexTotal', 'packGainNetPessimisteTotal', 'mgpeLoyerLtEuros', 'mgpeRedevanceFtEuros',
  'mgpePartServicesStEuros', 'mgpeDureeContratAns', 'gainNetContractuelEuros', 'gainNetAnnuelMairieEuros',
  'gainNetPessimisteEuros', 'gainNetOptimisteEuros', 'gainNetPlancher66pctEuros', 'fondsRoiAnnees',
  'fondsRoiPessimisteAnnees', 'fondsRoiOptimisteAnnees', 'tauxSubventionPessimistePct',
  'tauxEcoRealistePessimistePct', 'ratioPacWM2', 'scoreEligibiliteClosing', 'artisanDistanceKm',
  'artisanEffectifMin', 'puissancePacKw', 'ouvriersRequis', 'dureeEstimeeSemaines',
]);

const EMPTY_DATASET: ProspectionDataset = {
  meta: {
    filePath: '(missing)',
    rowCount: 0,
    loadedAt: new Date(0).toISOString(),
    fileMtimeMs: 0,
  },
  rows: [],
};

function csvCandidates(): string[] {
  const fromEnv = process.env.CLIM_CSV_PATH?.trim();
  return [
    fromEnv ? path.resolve(fromEnv) : null,
    path.resolve(process.cwd(), 'data/output_prospection.csv'),
    path.resolve(process.cwd(), '../../output_prospection.csv'),
  ].filter((p): p is string => Boolean(p));
}

async function resolveExistingCsvPath(): Promise<string | null> {
  for (const candidate of csvCandidates()) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }
  return null;
}

function parseNum(raw: unknown): number {
  if (raw == null || raw === '') return 0;
  const s = String(raw).replace(/\s/g, '').replace(',', '.');
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function parseBool(raw: unknown): boolean {
  const s = String(raw ?? '').trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'oui' || s === 'yes';
}

function parseCoord(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function mapCsvRecordToProspectRow(raw: Record<string, string>): ProspectRow {
  const out = {} as Record<keyof ProspectRow, ProspectRow[keyof ProspectRow]>;

  for (const [csvKey, propKey] of Object.entries(CSV_COLUMNS)) {
    const value = raw[csvKey] ?? '';
    if (propKey === 'alerteSurdimensionnement') {
      out[propKey] = parseBool(value);
    } else if (propKey === 'latitude' || propKey === 'longitude') {
      out[propKey] = parseCoord(value);
    } else if (NUMERIC_KEYS.has(propKey)) {
      out[propKey] = parseNum(value) as never;
    } else {
      out[propKey] = String(value).trim() as never;
    }
  }

  const row = out as ProspectRow;
  if (!row.departement?.trim()) {
    row.departement = departementFromInsee(row.codeInsee);
  }
  return row;
}

export async function loadProspectionFromCsv(): Promise<ProspectionDataset> {
  const filePath = await resolveExistingCsvPath();
  if (!filePath) {
    return EMPTY_DATASET;
  }

  const [content, stat] = await Promise.all([
    fs.readFile(filePath, 'utf-8'),
    fs.stat(filePath),
  ]);

  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length) {
    const first = parsed.errors[0];
    throw new Error(`CSV parse error row ${first.row}: ${first.message}`);
  }

  const rows = parsed.data
    .filter((r) => r.Code_UAI?.trim())
    .map(mapCsvRecordToProspectRow);

  return {
    meta: {
      filePath,
      rowCount: rows.length,
      loadedAt: new Date().toISOString(),
      fileMtimeMs: stat.mtimeMs,
    },
    rows,
  };
}
