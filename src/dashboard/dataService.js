import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { config } from '../config.js';
import { filterEetExportRows, validateEetConfig, resolveProprietaireFfoExportFields } from '../services/patrimoineFilter.js';
import { isBdnbQuotaBlocked } from '../services/bdnbQuotaState.js';
import { enrichAndPackagePortfolio } from '../finance/financeProcessor.js';
import { buildEpciPackageGroups } from '../finance/poolingEngine.js';
import { ensureEpciMapping } from '../services/epciMappingService.js';
import { attachIndustrialProfile } from '../industrial/index.js';
import { loadPopulationMaps, resolveCommune } from './populationCache.js';
import { loadPipelineStats } from './pipelineStats.js';
import { buildCommunesIndex, buildCommuneDossier } from './communeIndex.js';
import { loadArtisansCache } from './artisansCache.js';
import { resolveSchoolCoordinates } from './schoolCoordsService.js';
import { formatTrancheEffectif } from '../services/artisansService.js';
import { recalculateRowEnergyEconomics } from '../finance/energyEconomics.js';
import { attachClosingScoreFields } from '../finance/closingScoreEngine.js';

const NUMERIC_FIELDS = [
  'Surface_M2',
  'Annee_Construction',
  'Annee_DPE',
  'Conso_Annuelle_kWh',
  'Conso_Specifique_kWh_M2',
  'Facture_Annuelle_Euros',
  'Economie_Annuelle_Euros',
  'Economie_Realiste_Euros',
  'Economie_Plancher_66pct_Euros',
  'CAPEX_HT_Euros',
  'Subventions_Etat_Euros',
  'Subventions_Pessimiste_Euros',
  'Subventions_Optimiste_Euros',
  'CEE_Euros',
  'Part_Fonds_Euros',
  'Part_Fonds_Pessimiste_Euros',
  'Part_Fonds_Optimiste_Euros',
  'Pack_CAPEX_Total',
  'Pack_Gain_Net_Pessimiste_Total',
  'Artisan_Distance_KM',
  'Artisan_Effectif_Min',
  'CAPEX_Total',
  'MGPE_Loyer_Lt_Euros',
  'MGPE_Redevance_Ft_Euros',
  'MGPE_Part_Services_St_Euros',
  'MGPE_Duree_Contrat_Ans',
  'Gain_Net_Contractuel_Euros',
  'Gain_Net_Annuel_Mairie_Euros',
  'Gain_Net_Pessimiste_Euros',
  'Gain_Net_Optimiste_Euros',
  'Gain_Net_Plancher_66pct_Euros',
  'Fonds_ROI_Annees',
  'Fonds_ROI_Pessimiste_Annees',
  'Fonds_ROI_Optimiste_Annees',
  'Taux_Subvention_Pessimiste_Pct',
  'Taux_Eco_Realiste_Pessimiste_Pct',
  'Ratio_PAC_W_M2',
  'Score_Eligibilite_Closing',
  'Subventions_Detr_Euros',
  'Puissance_PAC_kW',
  'Ouvriers_Requis',
  'Duree_Estimee_Semaines',
];

const FINANCE_COLUMNS = [
  'Subventions_Etat_Euros',
  'CEE_Euros',
  'Part_Fonds_Euros',
  'Financement_Statut',
  'Package_ID',
];

function toNumber(value) {
  if (value == null || value === '') {
    return 0;
  }
  const parsed = Number(String(value).replace(/\s/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeRow(record) {
  const row = { ...record };
  for (const field of NUMERIC_FIELDS) {
    if (field in row) {
      row[field] = toNumber(row[field]);
    }
  }
  for (const field of ['Latitude', 'Longitude']) {
    if (row[field] != null && row[field] !== '') {
      const parsed = Number(row[field]);
      if (!Number.isNaN(parsed)) {
        row[field] = parsed;
      }
    }
  }
  return { ...row, ...resolveProprietaireFfoExportFields(row) };
}

function departmentFromUai(codeUai) {
  const raw = String(codeUai ?? '').slice(0, 3);
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? raw.replace(/^0+/, '') : String(parsed);
}

function hasFinanceColumns(records) {
  if (!records.length) {
    return false;
  }
  const keys = Object.keys(records[0]);
  return FINANCE_COLUMNS.every((col) => keys.includes(col));
}

function attachComputedFields(row, populationByInsee) {
  row.Departement = departmentFromUai(row.Code_UAI);
  row.CAPEX_Total =
    row.CAPEX_Total ||
    (row.Part_Fonds_Euros ?? 0) +
      (row.CEE_Euros ?? 0) +
      (row.Subventions_Etat_Euros ?? 0);

  const population = populationByInsee?.get(String(row.Code_INSEE ?? '')) ?? null;
  if (row.Score_Eligibilite_Closing == null) {
    Object.assign(row, attachClosingScoreFields(row, population));
  }

  delete row._capexTotal;
  delete row._fondsRoiYears;
  delete row._partFondsRaw;
  delete row._subventionCapEuros;
  delete row._subventionRawTotal;
  delete row._closingTempKey;
  return row;
}

async function loadRowsFromCheckpoint() {
  const file = path.join(config.cacheDir, 'checkpoint.json');
  try {
    const checkpoint = JSON.parse(await fs.readFile(file, 'utf8'));
    if (Array.isArray(checkpoint.results) && checkpoint.results.length > 0) {
      return { rows: checkpoint.results.map(normalizeRow), source: 'checkpoint' };
    }
  } catch {
    /* fallback CSV */
  }
  return null;
}

async function loadRowsFromCsv(outputFile) {
  const absolutePath = path.isAbsolute(outputFile)
    ? outputFile
    : path.resolve(process.cwd(), outputFile);

  const raw = await fs.readFile(absolutePath, 'utf8');
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
  });

  const stat = await fs.stat(absolutePath);
  return {
    rows: records.map(normalizeRow),
    source: 'csv',
    csvHasFinance: hasFinanceColumns(records),
    meta: {
      file: path.basename(absolutePath),
      updatedAt: stat.mtime.toISOString(),
    },
  };
}

function attachFieldsFromExportedCsv(row, populationByInsee) {
  const population = populationByInsee?.get(String(row.Code_INSEE ?? '')) ?? null;
  if (row.Score_Eligibilite_Closing == null) {
    Object.assign(row, attachClosingScoreFields(row, population));
  }
  return attachComputedFields(row, populationByInsee);
}

function enrichPortfolio(rows, populationMaps, options = {}) {
  const { preserveFinanceFromExport = false } = options;
  const populationByInsee = new Map(populationMaps.byInsee);

  const withInsee = rows.map((row) => {
    const commune = resolveCommune(row, populationMaps);
    const codeInsee = row.Code_INSEE ?? commune?.code ?? null;
    if (codeInsee && commune?.population != null) {
      populationByInsee.set(String(codeInsee), commune.population);
    }
    return { ...row, Code_INSEE: codeInsee };
  });

  const withEnergy = withInsee.map((row) => recalculateRowEnergyEconomics(row));
  const withIndustrial = withEnergy.map((row) => attachIndustrialProfile(row));

  if (preserveFinanceFromExport) {
    return withIndustrial.map((row) => attachFieldsFromExportedCsv(row, populationByInsee));
  }

  return enrichAndPackagePortfolio(withIndustrial, populationByInsee).map((row) =>
    attachComputedFields(row, populationByInsee),
  );
}

function attachArtisanEffectifFields(row, artisansBySiret, artisansByNom) {
  if (row.Artisan_Effectif_Label) {
    return row;
  }

  const tranche =
    row.Artisan_Tranche_Effectif ??
    artisansBySiret.get(row.Artisan_SIRET)?.trancheEffectif ??
    artisansByNom.get(row.Artisan_Nom)?.trancheEffectif;

  if (!tranche) {
    return row;
  }

  const effectif = formatTrancheEffectif(tranche);
  return {
    ...row,
    Artisan_Tranche_Effectif: effectif.code,
    Artisan_Effectif_Label: effectif.label,
    Artisan_Effectif_Min: effectif.min,
  };
}

async function enrichSchoolsWithArtisanEffectif(schools) {
  const cache = await loadArtisansCache();
  const artisansBySiret = new Map(cache.filter((a) => a.siret).map((a) => [a.siret, a]));
  const artisansByNom = new Map(cache.map((a) => [a.nom, a]));
  return schools.map((row) => attachArtisanEffectifFields(row, artisansBySiret, artisansByNom));
}

function buildPackages(schools) {
  return buildEpciPackageGroups(schools)
    .filter((pkg) => pkg.packFinancable)
    .map((pkg) => ({
      id: pkg.id,
      codeEpci: pkg.codeEpci,
      nomEpci: pkg.nomEpci,
      capexTotal: pkg.capexTotal,
      gainNetPessimisteTotal: pkg.gainNetPessimisteTotal,
      schools: pkg.schools,
      isDraft: false,
      packFinancable: true,
      ticketValid: true,
      progressPct: 100,
      remainingEuros: 0,
    }));
}

function buildKpis(schools) {
  const totalCapex = schools.reduce((sum, row) => sum + (row.CAPEX_Total ?? 0), 0);
  const totalEconomies = schools.reduce(
    (sum, row) => sum + (row.Economie_Realiste_Euros ?? row.Economie_Annuelle_Euros ?? 0),
    0,
  );
  const totalEconomiesContractuelles = schools.reduce(
    (sum, row) => sum + (row.Economie_Annuelle_Euros ?? 0),
    0,
  );
  const totalGainNetMairie = schools.reduce(
    (sum, row) => sum + (row.Gain_Net_Annuel_Mairie_Euros ?? 0),
    0,
  );
  const commissionRate = config.dashboard.commissionRate;

  return {
    totalSchools: schools.length,
    totalCapex,
    totalEconomies,
    totalEconomiesContractuelles,
    financeModel: config.finance.subsidyStacking,
    cpeRealisationRate: config.finance.cpeRealisationRate,
    totalGainNetMairie,
    totalPartFonds: schools.reduce((sum, row) => sum + (row.Part_Fonds_Euros ?? 0), 0),
    totalCommission: Math.round(totalCapex * commissionRate),
    commissionRate,
    prixKwhTertiaire: config.getPrixKwhTertiaire(),
    soloCount: schools.filter((s) => s.Financement_Statut === 'FINANÇABLE_SOLO').length,
    regrouperCount: schools.filter((s) => s.Financement_Statut === 'À_REGROUPER').length,
    packEpciCount: schools.filter((s) => s.Financement_Statut === 'PACK_FINANÇABLE_EPCI').length,
    projetGlobalValideCount: new Set(
      schools.filter((s) => s.Statut_Projet_EPCI === 'PROJET_GLOBAL_VALIDE').map((s) => s.Code_EPCI),
    ).size,
    packagerCount: schools.filter(
      (s) => s.Financement_Statut === 'À_REGROUPER' || s.Financement_Statut === 'À_PACKAGER',
    ).length,
    packageCount: new Set(
      schools.map((s) => s.Package_ID).filter((id) => String(id).startsWith('EPCI-')),
    ).size,
  };
}

function buildAnalytics(schools) {
  const dpeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, Autre: 0 };
  const capexByDepartment = {};
  const communeAgg = new Map();

  for (const school of schools) {
    const grade = String(school.Classe_DPE ?? '').toUpperCase().charAt(0);
    if (dpeDistribution[grade] != null) {
      dpeDistribution[grade] += 1;
    } else {
      dpeDistribution.Autre += 1;
    }

    const dept = school.Departement ?? departmentFromUai(school.Code_UAI);
    capexByDepartment[dept] = (capexByDepartment[dept] ?? 0) + (school.CAPEX_Total ?? 0);

    const communeKey = school.Code_INSEE ?? school.Commune ?? 'Inconnu';
    const communeLabel = school.Commune ?? communeKey;
    if (!communeAgg.has(communeKey)) {
      communeAgg.set(communeKey, { commune: communeLabel, codeInsee: school.Code_INSEE, schools: 0, capex: 0, economies: 0 });
    }
    const agg = communeAgg.get(communeKey);
    agg.schools += 1;
    agg.capex += school.CAPEX_Total ?? 0;
    agg.economies += school.Economie_Annuelle_Euros ?? 0;
  }

  const topCommunes = [...communeAgg.values()]
    .sort((a, b) => b.capex - a.capex)
    .slice(0, 10);

  return { dpeDistribution, capexByDepartment, topCommunes };
}

function buildStatus(dataSource, csvHasFinance, pipeline, schools, populationMaps) {
  const flags = [];
  if (dataSource === 'checkpoint') {
    flags.push({ level: 'info', message: 'Données live depuis le checkpoint (run en cours ou récent)' });
  }
  if (dataSource === 'csv' && !csvHasFinance) {
    flags.push({ level: 'warn', message: 'CSV sans colonnes finance — recalcul avec population réelle' });
  }
  if (populationMaps.byInsee.size === 0) {
    flags.push({
      level: 'warn',
      message: 'Cache population absent — lancez le pipeline une fois pour des subventions exactes',
    });
  }
  if (pipeline?.isRunning) {
    flags.push({
      level: 'info',
      message: `Pipeline actif · ${pipeline.processed}/${pipeline.totalSchools} écoles traitées (${pipeline.progressPct} %)`,
    });
  }
  if (pipeline?.pendingRetry > 0) {
    flags.push({
      level: 'warn',
      message: `${pipeline.pendingRetry} école(s) en attente BDNB (quota API ou cache manquant)`,
    });
  }
  if (isBdnbQuotaBlocked() && !config.bdnb.localOnly) {
    flags.push({
      level: 'warn',
      message: 'Quota BDNB API épuisé — index local (npm run bdnb:build-index) ou reset mensuel',
    });
  }
  if (config.bdnb.localOnly) {
    flags.push({ level: 'info', message: 'Mode BDNB local uniquement (0 appel API)' });
  } else if (isBdnbQuotaBlocked()) {
    flags.push({
      level: 'info',
      message: 'BDNB : quota API bloqué — cache/index local utilisé si disponible',
    });
  }
  if (schools.length === 0) {
    flags.push({ level: 'error', message: 'Aucune école exportée pour le moment' });
  }
  return flags;
}

function buildFilterOptions(schools) {
  return {
    departments: [...new Set(schools.map((s) => s.Departement).filter(Boolean))].sort(),
    artisans: [...new Set(schools.map((s) => s.Artisan_Nom).filter(Boolean))].sort(),
    dpeGrades: [...new Set(schools.map((s) => String(s.Classe_DPE ?? '').toUpperCase().charAt(0)).filter((g) => g && g !== '—'))].sort(),
    financeStatuses: ['FINANÇABLE_SOLO', 'À_REGROUPER', 'PACK_FINANÇABLE_EPCI', 'À_PACKAGER'],
    packageStatuses: ['SOLO', 'PKG', 'ORPHAN'],
  };
}

export async function loadDashboardData(outputFile = config.outputFile) {
  validateEetConfig();
  const populationMaps = await loadPopulationMaps();
  const pipeline = await loadPipelineStats();

  let csvData = null;
  try {
    csvData = await loadRowsFromCsv(outputFile);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const checkpointData = await loadRowsFromCheckpoint();
  let rows;
  let dataSource;
  let csvHasFinance = csvData?.csvHasFinance ?? false;
  let fileMeta = csvData?.meta ?? { file: path.basename(outputFile), updatedAt: null };

  const useCheckpoint =
    pipeline?.isRunning ||
    (!csvData && checkpointData) ||
    (checkpointData && csvData && checkpointData.rows.length > csvData.rows.length);

  if (useCheckpoint && checkpointData) {
    rows = checkpointData.rows;
    dataSource = 'checkpoint';
    fileMeta = {
      file: 'checkpoint.json',
      updatedAt: pipeline?.updatedAt ?? new Date().toISOString(),
    };
  } else if (csvData) {
    rows = csvData.rows;
    dataSource = 'csv';
    csvHasFinance = csvData.csvHasFinance;
    fileMeta = csvData.meta;
  } else {
    rows = [];
    dataSource = 'none';
  }

  const { kept: guardedRows, removed: surfaceGuardRemoved } = filterEetExportRows(rows);
  rows = guardedRows;

  const rowsWithCoords = rows.length ? await resolveSchoolCoordinates(rows) : [];
  const preserveFinanceFromExport =
    dataSource === 'csv' && csvHasFinance && !config.dashboard.recomputeFinance;
  if (!preserveFinanceFromExport && rowsWithCoords.length) {
    await ensureEpciMapping();
  }
  const schools = await enrichSchoolsWithArtisanEffectif(
    enrichPortfolio(rowsWithCoords, populationMaps, { preserveFinanceFromExport }),
  );
  const communes = buildCommunesIndex(schools, populationMaps);
  const packages = buildPackages(schools);
  const epciPackages = buildEpciPackageGroups(schools);
  const draftPackages = epciPackages.filter((p) => !p.packFinancable);
  const kpis = buildKpis(schools);
  const analytics = buildAnalytics(schools);
  const status = buildStatus(dataSource, csvHasFinance, pipeline, schools, populationMaps);
  if (surfaceGuardRemoved > 0) {
    status.push({
      level: 'warn',
      message: `${surfaceGuardRemoved} ligne(s) écartée(s) — Surface finale < ${config.eet.eligibleSurfaceMin} m² (Décret Tertiaire strict)`,
    });
  }
  if (preserveFinanceFromExport) {
    status.push({
      level: 'info',
      message: 'Finance lue depuis le CSV exporté (identique à prospect:reexport)',
    });
  }

  return {
    kpis,
    packages,
    epciPackages,
    draftPackages,
    schools,
    communes,
    analytics,
    pipeline,
    status,
    filters: buildFilterOptions(schools),
    config: {
      minPackagePartFonds: config.finance.minPackagePartFonds,
      minPartFondsSolo: config.finance.minPartFondsSolo,
      autoRefreshSec: config.dashboard.autoRefreshSec,
      runAuthRequired: Boolean(config.dashboard.apiToken),
      bdnbQuotaBlocked: isBdnbQuotaBlocked(),
      bdnbLocalOnly: config.bdnb.localOnly,
      bdnbPreferLocal: config.bdnb.preferLocal,
      prixKwhTertiaire: config.getPrixKwhTertiaire(),
      prixKwhSource: config.cpe.prixKwhSource,
      subsidyStacking: config.finance.subsidyStacking,
      cpeRealisationRate: config.finance.cpeRealisationRate,
      fondsVertRealisticRate: config.finance.fondsVertRealisticRate,
      objectifGainCpe: config.cpe.objectifGainCpe,
      regionLabel: config.regionLabel,
      departments: config.departments,
    },
    meta: {
      ...fileMeta,
      rowCount: schools.length,
      dataSource,
      csvHasFinance,
      recomputeFinance: !preserveFinanceFromExport,
      financePreservedFromCsv: preserveFinanceFromExport,
    },
  };
}

export async function loadCommuneDossier(codeInsee, outputFile = config.outputFile) {
  const populationMaps = await loadPopulationMaps();
  const data = await loadDashboardData(outputFile);
  const dossier = buildCommuneDossier(codeInsee, data.schools, populationMaps);
  if (!dossier) {
    const error = new Error(`Aucun dossier pour la commune INSEE ${codeInsee}`);
    error.code = 'NOT_FOUND';
    throw error;
  }
  return dossier;
}
