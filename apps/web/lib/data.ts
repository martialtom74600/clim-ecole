import { cache } from 'react';
import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import type {
  DashboardKpis,
  EpciDetail,
  EpciSummaryRow,
  EpciTriageRow,
  ClosingLevel,
  MapMarker,
  PortfolioData,
  PipelineCard,
  PipelineStage,
  ProspectRow,
  ProspectionDataset,
  SoloOpportunity,
} from './types';
import {
  formatCommunesLabel,
  formatEpciDisplayName,
} from './format';
import {
  epciPipelineId,
  getPipelineStore,
  schoolPipelineId,
} from './pipeline';

const CSV_COLUMNS: Record<string, keyof ProspectRow> = {
  Code_UAI: 'codeUai',
  Code_INSEE: 'codeInsee',
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

function mapRawRow(raw: Record<string, string>): ProspectRow {
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

  return out as ProspectRow;
}

export function isClosingChaud(temperature: string): boolean {
  const t = String(temperature ?? '').toLowerCase();
  return t.includes('chaud') || String(temperature).includes('🔥');
}

export function isClosingTiede(temperature: string): boolean {
  const t = String(temperature ?? '').toLowerCase();
  return t.includes('tiède') || t.includes('tiede') || String(temperature).includes('⚡');
}

export function isClosingFroid(temperature: string): boolean {
  const t = String(temperature ?? '').toLowerCase();
  return t.includes('froid') || String(temperature).includes('❄');
}

export function temperatureLevel(temperature: string): ClosingLevel {
  if (isClosingChaud(temperature)) return 'chaud';
  if (isClosingTiede(temperature)) return 'tiede';
  return 'froid';
}

const TEMP_PRIORITY: Record<ClosingLevel, number> = {
  chaud: 3,
  tiede: 2,
  froid: 1,
};

const TEMP_LABEL: Record<ClosingLevel, string> = {
  chaud: '🔥 Chaud',
  tiede: '⚡ Tiède',
  froid: '❄ Froid',
};

interface EpciAccumulator {
  codeEpci: string;
  nomEpci: string;
  communes: Set<string>;
  batimentCount: number;
  packCapexTotal: number;
  packGainNetPessimiste: number;
  gainNetMairieTotal: number;
  subventionsTotal: number;
  resteAChargeTotal: number;
  financementStatut: ProspectRow['financementStatut'];
  statutProjetEpci: ProspectRow['statutProjetEpci'];
  scoreMax: number;
  temperatureLevel: ClosingLevel;
  batiments: ProspectRow[];
}

function mergeTemperature(current: ClosingLevel, next: ClosingLevel): ClosingLevel {
  return TEMP_PRIORITY[next] > TEMP_PRIORITY[current] ? next : current;
}

function buildEpciAccumulators(rows: ProspectRow[]): Map<string, EpciAccumulator> {
  const byEpci = new Map<string, EpciAccumulator>();

  for (const row of rows) {
    const key = row.codeEpci || row.nomEpci;
    if (!key) continue;

    const level = temperatureLevel(row.closingTemperature);
    const existing = byEpci.get(key);

    if (!existing) {
      byEpci.set(key, {
        codeEpci: row.codeEpci,
        nomEpci: row.nomEpci,
        communes: new Set(row.commune ? [row.commune] : []),
        batimentCount: 1,
        packCapexTotal: row.packCapexTotal,
        packGainNetPessimiste: row.packGainNetPessimisteTotal,
        gainNetMairieTotal: row.gainNetAnnuelMairieEuros,
        subventionsTotal: row.subventionsPessimisteEuros,
        resteAChargeTotal: row.partFondsPessimisteEuros,
        financementStatut: row.financementStatut,
        statutProjetEpci: row.statutProjetEpci,
        scoreMax: row.scoreEligibiliteClosing,
        temperatureLevel: level,
        batiments: [row],
      });
      continue;
    }

    existing.batimentCount += 1;
    existing.packCapexTotal = Math.max(existing.packCapexTotal, row.packCapexTotal);
    existing.packGainNetPessimiste = Math.max(
      existing.packGainNetPessimiste,
      row.packGainNetPessimisteTotal,
    );
    existing.gainNetMairieTotal += row.gainNetAnnuelMairieEuros;
    existing.subventionsTotal += row.subventionsPessimisteEuros;
    existing.resteAChargeTotal += row.partFondsPessimisteEuros;
    existing.scoreMax = Math.max(existing.scoreMax, row.scoreEligibiliteClosing);
    existing.temperatureLevel = mergeTemperature(existing.temperatureLevel, level);
    if (row.commune) existing.communes.add(row.commune);
    existing.batiments.push(row);
  }

  return byEpci;
}

function toEpciSummary(acc: EpciAccumulator): EpciSummaryRow {
  const communes = [...acc.communes];
  return {
    codeEpci: acc.codeEpci,
    nomEpci: acc.nomEpci,
    displayName: formatEpciDisplayName(acc.nomEpci, acc.codeEpci),
    communesLabel: formatCommunesLabel(communes),
    batimentCount: acc.batimentCount,
    packCapexTotal: acc.packCapexTotal,
    gainNetMairieTotal: acc.gainNetMairieTotal,
    temperatureGlobale: TEMP_LABEL[acc.temperatureLevel],
    temperatureLevel: acc.temperatureLevel,
    statutProjetEpci: acc.statutProjetEpci,
    scoreMax: acc.scoreMax,
  };
}

function toEpciTriage(acc: EpciAccumulator): EpciTriageRow {
  return {
    codeEpci: acc.codeEpci,
    nomEpci: acc.nomEpci,
    packCapexTotal: acc.packCapexTotal,
    packGainNetPessimiste: acc.packGainNetPessimiste,
    batimentCount: acc.batimentCount,
    financementStatut: acc.financementStatut,
    statutProjetEpci: acc.statutProjetEpci,
    scoreMax: acc.scoreMax,
  };
}

export const loadProspectionData = cache(async (): Promise<ProspectionDataset> => {
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
    .map(mapRawRow);

  return {
    meta: {
      filePath,
      rowCount: rows.length,
      loadedAt: new Date().toISOString(),
      fileMtimeMs: stat.mtimeMs,
    },
    rows,
  };
});

export const getDashboardKpis = cache(async (): Promise<DashboardKpis> => {
  const { rows } = await loadProspectionData();

  const epciSet = new Set<string>();
  let totalCapex = 0;
  let leadsChauds = 0;
  let leadsTiedes = 0;
  let soloFinancables = 0;
  let packEpciFinancables = 0;

  for (const row of rows) {
    totalCapex += row.capexTotal;
    if (row.codeEpci) epciSet.add(row.codeEpci);
    if (isClosingChaud(row.closingTemperature)) leadsChauds += 1;
    if (isClosingTiede(row.closingTemperature)) leadsTiedes += 1;
    if (row.financementStatut === 'FINANÇABLE_SOLO') soloFinancables += 1;
    if (row.financementStatut === 'PACK_FINANÇABLE_EPCI') packEpciFinancables += 1;
  }

  return {
    totalCapex,
    totalBatiments: rows.length,
    epciUniques: epciSet.size,
    leadsChauds,
    leadsTiedes,
    soloFinancables,
    packEpciFinancables,
  };
});

export const getTopEpciTriage = cache(async (limit = 5): Promise<EpciTriageRow[]> => {
  const { rows } = await loadProspectionData();
  return [...buildEpciAccumulators(rows).values()]
    .map(toEpciTriage)
    .sort((a, b) => b.packCapexTotal - a.packCapexTotal)
    .slice(0, limit);
});

export const getAllEpciSummary = cache(async (): Promise<EpciSummaryRow[]> => {
  const { rows } = await loadProspectionData();
  return [...buildEpciAccumulators(rows).values()]
    .map(toEpciSummary)
    .sort((a, b) => b.packCapexTotal - a.packCapexTotal);
});

export const getEpciByCode = cache(async (code: string): Promise<EpciDetail | null> => {
  const { rows } = await loadProspectionData();
  const acc = buildEpciAccumulators(rows).get(code);
  if (!acc) return null;

  const communes = [...acc.communes];
  return {
    codeEpci: acc.codeEpci,
    nomEpci: acc.nomEpci,
    displayName: formatEpciDisplayName(acc.nomEpci, acc.codeEpci),
    communesLabel: formatCommunesLabel(communes),
    packCapexTotal: acc.packCapexTotal,
    subventionsTotal: acc.subventionsTotal,
    resteAChargeTotal: acc.resteAChargeTotal,
    gainNetMairieTotal: acc.gainNetMairieTotal,
    temperatureGlobale: TEMP_LABEL[acc.temperatureLevel],
    temperatureLevel: acc.temperatureLevel,
    statutProjetEpci: acc.statutProjetEpci,
    batimentCount: acc.batimentCount,
    batiments: [...acc.batiments].sort((a, b) => b.capexTotal - a.capexTotal),
  };
});

export const getPortfolioData = cache(async (): Promise<PortfolioData> => {
  const { rows } = await loadProspectionData();
  const solosChauds: SoloOpportunity[] = [];
  const solosQualified: SoloOpportunity[] = [];

  for (const row of rows) {
    const chaud = isClosingChaud(row.closingTemperature);
    const qualified =
      row.partFondsPessimisteEuros >= 100_000 && row.fondsRoiPessimisteAnnees < 12;

    if (chaud) {
      solosChauds.push({ row, tier: 'chaud' });
    } else if (qualified) {
      solosQualified.push({ row, tier: 'qualified' });
    }
  }

  solosChauds.sort((a, b) => b.row.capexTotal - a.row.capexTotal);
  solosQualified.sort((a, b) => b.row.capexTotal - a.row.capexTotal);

  const packsValides = [...buildEpciAccumulators(rows).values()]
    .map(toEpciSummary)
    .filter((e) => e.packCapexTotal > 1_000_000)
    .sort((a, b) => b.packCapexTotal - a.packCapexTotal);

  return { solosChauds, solosQualified, packsValides };
});

export const getMapMarkers = cache(async (): Promise<MapMarker[]> => {
  const { rows } = await loadProspectionData();
  return rows
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r) => ({
      id: r.codeUai,
      codeUai: r.codeUai,
      codeEpci: r.codeEpci,
      lat: r.latitude!,
      lon: r.longitude!,
      dpe: r.classeDpe,
      statutDpe: r.statutDpe,
      capex: r.capexTotal,
      resteACharge: r.partFondsPessimisteEuros,
      gainNetMairie: r.gainNetAnnuelMairieEuros,
      surfaceM2: r.surfaceM2,
      nomEcole: r.nomEcole,
      commune: r.commune,
      temperature: r.closingTemperature,
      temperatureLevel: temperatureLevel(r.closingTemperature),
      financementStatut: r.financementStatut,
    }));
});

export const getPipelineCards = cache(async (): Promise<PipelineCard[]> => {
  const { rows } = await loadProspectionData();
  const store = await getPipelineStore();
  const cards: PipelineCard[] = [];

  for (const row of rows) {
    const chaud = isClosingChaud(row.closingTemperature);
    const qualified =
      row.partFondsPessimisteEuros >= 100_000 && row.fondsRoiPessimisteAnnees < 12;
    if (!chaud && !qualified) continue;

    const id = schoolPipelineId(row.codeUai);
    const defaultStage: PipelineStage = chaud ? 'identifie' : 'qualifie';

    cards.push({
      id,
      type: 'school',
      stage: store.items[id]?.stage ?? defaultStage,
      note: store.items[id]?.note,
      followUpDate: store.items[id]?.followUpDate,
      title: row.nomEcole,
      subtitle: row.commune,
      capex: row.capexTotal,
      temperature: row.closingTemperature,
      temperatureLevel: temperatureLevel(row.closingTemperature),
      href: `/admin/epci/${row.codeEpci}`,
    });
  }

  const epcis = [...buildEpciAccumulators(rows).values()]
    .map(toEpciSummary)
    .filter((e) => e.packCapexTotal > 1_000_000);

  for (const e of epcis) {
    const id = epciPipelineId(e.codeEpci);
    const defaultStage: PipelineStage =
      e.statutProjetEpci === 'PROJET_GLOBAL_VALIDE' ? 'dossier' : 'qualifie';

    cards.push({
      id,
      type: 'epci',
      stage: store.items[id]?.stage ?? defaultStage,
      note: store.items[id]?.note,
      followUpDate: store.items[id]?.followUpDate,
      title: e.displayName,
      subtitle: e.communesLabel || `${e.batimentCount} bâtiments`,
      capex: e.packCapexTotal,
      temperature: e.temperatureGlobale,
      temperatureLevel: e.temperatureLevel,
      href: `/admin/epci/${e.codeEpci}`,
    });
  }

  return cards;
});

export const getHotLeadsPreview = cache(async (limit = 6) => {
  const { rows } = await loadProspectionData();
  return rows
    .filter((r) => isClosingChaud(r.closingTemperature))
    .sort((a, b) => b.capexTotal - a.capexTotal)
    .slice(0, limit)
    .map((r) => ({
      codeUai: r.codeUai,
      nomEcole: r.nomEcole,
      commune: r.commune,
      capex: r.capexTotal,
      codeEpci: r.codeEpci,
    }));
});

export const getCsvSyncMeta = cache(async () => {
  const { meta } = await loadProspectionData();
  return {
    rowCount: meta.rowCount,
    fileMtimeMs: meta.fileMtimeMs,
    loadedAt: meta.loadedAt,
  };
});
