/**
 * Je vérifie la cohérence des calculs financiers / énergétiques / MGPE-PD / closing.
 * Usage: node src/scripts/auditCalculations.js [chemin-csv]
 */
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { config } from '../config.js';
import { computeTechnicalProfile } from '../industrial/technicalEngine.js';
import {
  computeEnergyEconomics,
  parseRawDpeConsoFromRow,
  parseDpeGrade,
  resolveConsoSpecifiqueKwhM2,
} from '../finance/energyEconomics.js';
import {
  computeSchoolFinanceBase,
  computeFondsRoiYears,
  assignFinancingStatus,
} from '../finance/roiEngine.js';
import {
  computeDualScenarioFinances,
  formatDualScenarioLabels,
  buildAdaptiveContextFromRow,
} from '../finance/scenarioEngine.js';
import { computePacSurdimensionnementAlert } from '../finance/adaptiveScenarioContext.js';
import { computePerformanceFloorSavings } from '../finance/realisticEconomics.js';
import { computeClosingScore } from '../finance/closingScoreEngine.js';
import { generateFinancialPackages } from '../finance/poolingEngine.js';
import { ensureEpciMapping, getEpciMappingSync } from '../services/epciMappingService.js';
import { loadPopulationMaps } from '../dashboard/populationCache.js';
import { initPrixKwhMoyenTertiaire } from '../services/energyPriceService.js';

const TOLERANCE_EUR = 1;
const TOLERANCE_ROI = 0.15;
const TOLERANCE_SCORE = 1;

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

function nearRoi(a, b, tol = TOLERANCE_ROI) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= tol;
}

function near(a, b, tol = TOLERANCE_EUR) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= tol;
}

function auditRow(row, populationByInsee) {
  const issues = [];
  const surface = num(row.Surface_M2) ?? 0;
  const year = num(row.Annee_Construction);
  const pop = populationByInsee.get(String(row.Code_INSEE ?? '')) ?? null;

  const tech = computeTechnicalProfile(surface, year);
  const expectedCapex = tech.capexTechniqueEur;

  const storedConso = num(row.Conso_Specifique_kWh_M2);
  const rawConso =
    storedConso != null && storedConso > 0 && storedConso <= 400
      ? storedConso
      : parseRawDpeConsoFromRow(row);
  const grade = parseDpeGrade(row.Classe_DPE) ?? parseDpeGrade(row.Statut_DPE);
  const consoSpec = resolveConsoSpecifiqueKwhM2({ rawConsoKwhM2: rawConso });
  const prixKwh = config.getPrixKwhTertiaire();
  const energy = computeEnergyEconomics(surface, consoSpec);

  const base = computeSchoolFinanceBase({
    surfaceM2: surface,
    capexTechniqueEur: expectedCapex,
    anneeConstruction: year,
  });

  const economieContractuelle = energy.economieAnnuelleEuros;
  const typeTravaux = row.Type_Travaux || tech.typeTravaux;
  const pacKw = num(row.Puissance_PAC_kW) ?? tech.puissancePacKw;
  const adaptiveContext = buildAdaptiveContextFromRow(
    { ...row, Type_Travaux: typeTravaux },
    pop,
  );
  const dual = computeDualScenarioFinances({
    capexTotalTtc: expectedCapex,
    ceeEuros: base.CEE_Euros,
    economieContractuelleEuros: economieContractuelle,
    adaptiveContext,
  });
  const pacAlert = computePacSurdimensionnementAlert({
    typeTravaux,
    puissancePacKw: pacKw,
    surfaceM2: surface,
  });
  const pes = dual.pessimiste;
  const opt = dual.optimiste;
  const labels = formatDualScenarioLabels(dual);

  const gainNetPes = pes.Gain_Net_Annuel_Mairie_Euros;
  const fondsRoiPes = pes.Fonds_ROI_Annees;
  const financeStatutPreEpci = assignFinancingStatus(
    pes.Part_Fonds_Euros,
    fondsRoiPes,
    gainNetPes,
  );
  const closingScore = computeClosingScore({
    distanceKm: num(row.Artisan_Distance_KM),
    gainNetMairieEuros: gainNetPes,
    classeDpe: row.Classe_DPE,
    population: pop,
  });

  const checks = [
    ['Conso_Specifique_kWh_M2', num(row.Conso_Specifique_kWh_M2), Math.round(consoSpec * 100) / 100, 0.02],
    ['Conso_Annuelle_kWh', num(row.Conso_Annuelle_kWh), energy.consoAnnuelleKwh, 0],
    ['Facture_Annuelle_Euros', num(row.Facture_Annuelle_Euros), energy.factureAnnuelleEuros, TOLERANCE_EUR],
    ['Economie_Annuelle_Euros', num(row.Economie_Annuelle_Euros), energy.economieAnnuelleEuros, TOLERANCE_EUR],
    ['Modele_Financement', String(row.Modele_Financement ?? ''), 'fourchette', 0],
    ['CAPEX_HT_Euros', num(row.CAPEX_HT_Euros), base.CAPEX_HT_Euros, TOLERANCE_EUR],
    ['CEE_Euros', num(row.CEE_Euros), base.CEE_Euros, TOLERANCE_EUR],
    ['Subventions_Pessimiste_Euros', num(row.Subventions_Pessimiste_Euros), dual.Subventions_Pessimiste_Euros, TOLERANCE_EUR],
    ['Subventions_Optimiste_Euros', num(row.Subventions_Optimiste_Euros), dual.Subventions_Optimiste_Euros, TOLERANCE_EUR],
    ['Part_Fonds_Pessimiste_Euros', num(row.Part_Fonds_Pessimiste_Euros), dual.Part_Fonds_Pessimiste_Euros, TOLERANCE_EUR],
    ['Part_Fonds_Optimiste_Euros', num(row.Part_Fonds_Optimiste_Euros), dual.Part_Fonds_Optimiste_Euros, TOLERANCE_EUR],
    ['Economie_Realiste_Euros', num(row.Economie_Realiste_Euros), pes.Economie_Realiste_Euros, TOLERANCE_EUR],
    ['Part_Fonds_Euros', num(row.Part_Fonds_Euros), pes.Part_Fonds_Euros, TOLERANCE_EUR],
    ['Subventions_Etat_Euros', num(row.Subventions_Etat_Euros), pes.Subventions_Etat_Euros, TOLERANCE_EUR],
    ['MGPE_Redevance_Ft_Euros', num(row.MGPE_Redevance_Ft_Euros), pes.MGPE_Redevance_Ft_Euros, TOLERANCE_EUR],
    ['MGPE_Part_Services_St_Euros', num(row.MGPE_Part_Services_St_Euros), pes.MGPE_Part_Services_St_Euros, TOLERANCE_EUR],
    ['MGPE_Loyer_Lt_Euros', num(row.MGPE_Loyer_Lt_Euros), pes.MGPE_Loyer_Lt_Euros, TOLERANCE_EUR],
    ['Gain_Net_Pessimiste_Euros', num(row.Gain_Net_Pessimiste_Euros), dual.Gain_Net_Pessimiste_Euros, TOLERANCE_EUR],
    ['Gain_Net_Optimiste_Euros', num(row.Gain_Net_Optimiste_Euros), dual.Gain_Net_Optimiste_Euros, TOLERANCE_EUR],
    ['Gain_Net_Annuel_Mairie_Euros', num(row.Gain_Net_Annuel_Mairie_Euros), gainNetPes, TOLERANCE_EUR],
    ['Taux_Subvention_Pessimiste_Pct', num(row.Taux_Subvention_Pessimiste_Pct), dual.Taux_Subvention_Pessimiste_Pct, 0.05],
    ['Taux_Eco_Realiste_Pessimiste_Pct', num(row.Taux_Eco_Realiste_Pessimiste_Pct), dual.Taux_Eco_Realiste_Pessimiste_Pct, 0.05],
    ['Ratio_PAC_W_M2', num(row.Ratio_PAC_W_M2), pacAlert.Ratio_PAC_W_M2, 0.2],
    ['Score_Eligibilite_Closing', num(row.Score_Eligibilite_Closing), closingScore, TOLERANCE_SCORE],
  ];

  for (const [field, actual, expected, tol] of checks) {
    if (field === 'Modele_Financement') {
      if (actual !== expected) {
        issues.push({ field, actual, expected, msg: `attendu ${expected}, CSV ${actual}` });
      }
      continue;
    }
    if (!near(actual, expected, tol)) {
      issues.push({
        field,
        actual,
        expected,
        delta: actual != null && expected != null ? actual - expected : null,
      });
    }
  }

  const roiChecks = [
    ['Fonds_ROI_Pessimiste_Annees', num(row.Fonds_ROI_Pessimiste_Annees), dual.Fonds_ROI_Pessimiste_Annees],
    ['Fonds_ROI_Optimiste_Annees', num(row.Fonds_ROI_Optimiste_Annees), dual.Fonds_ROI_Optimiste_Annees],
    ['Fonds_ROI_Annees', num(row.Fonds_ROI_Annees), fondsRoiPes],
  ];
  for (const [field, actual, expected] of roiChecks) {
    if (!nearRoi(actual, expected)) {
      issues.push({ field, actual, expected });
    }
  }

  if (row.Subventions_Fourchette_Label && row.Subventions_Fourchette_Label !== labels.subventionsLabel) {
    issues.push({
      field: 'Subventions_Fourchette_Label',
      actual: row.Subventions_Fourchette_Label,
      expected: labels.subventionsLabel,
    });
  }
  if (row.Gain_Net_Fourchette_Label && row.Gain_Net_Fourchette_Label !== labels.gainNetLabel) {
    issues.push({
      field: 'Gain_Net_Fourchette_Label',
      actual: row.Gain_Net_Fourchette_Label,
      expected: labels.gainNetLabel,
    });
  }

  const csvPacAlert = String(row.Alerte_Surdimensionnement ?? '').toLowerCase() === 'true';
  if (csvPacAlert !== pacAlert.Alerte_Surdimensionnement) {
    issues.push({
      field: 'Alerte_Surdimensionnement',
      actual: csvPacAlert,
      expected: pacAlert.Alerte_Surdimensionnement,
    });
  }

  const csvCapexImplied =
    (num(row.Part_Fonds_Pessimiste_Euros) ?? num(row.Part_Fonds_Euros) ?? 0) +
    (num(row.CEE_Euros) ?? 0) +
    (num(row.Subventions_Pessimiste_Euros) ?? num(row.Subventions_Etat_Euros) ?? 0);

  if (!near(csvCapexImplied, expectedCapex, 2)) {
    issues.push({
      field: 'CAPEX_implied',
      actual: csvCapexImplied,
      expected: expectedCapex,
      msg: 'Part_Fonds + CEE + Subventions ≠ CAPEX technique (scénario pessimiste)',
    });
  }

  const gainPlancher = Math.round(
    computePerformanceFloorSavings(economieContractuelle) - pes.MGPE_Loyer_Lt_Euros,
  );
  if (
    !near(num(row.Gain_Net_Plancher_66pct_Euros), gainPlancher, TOLERANCE_EUR) &&
    row.Gain_Net_Plancher_66pct_Euros != null &&
    row.Gain_Net_Plancher_66pct_Euros !== ''
  ) {
    issues.push({
      field: 'Gain_Net_Plancher_66pct_Euros',
      actual: num(row.Gain_Net_Plancher_66pct_Euros),
      expected: gainPlancher,
    });
  }

  if (gainNetPes <= 0 && String(row.Financement_Statut) === 'FINANÇABLE_SOLO') {
    issues.push({
      field: 'Gain_Net_logic',
      msg: `gain net pessimiste ${gainNetPes} ≤ 0 mais statut FINANÇABLE_SOLO`,
    });
  }

  if (
    String(row.Financement_Statut) === 'PACK_FINANÇABLE_EPCI' &&
    num(row.Pack_Gain_Net_Pessimiste_Total) != null &&
    num(row.Pack_Gain_Net_Pessimiste_Total) <= 0
  ) {
    issues.push({
      field: 'Pack_EPCI_logic',
      msg: 'PACK_FINANÇABLE_EPCI mais gain net pack pessimiste ≤ 0',
    });
  }

  if (
    dual.Gain_Net_Pessimiste_Euros > dual.Gain_Net_Optimiste_Euros ||
    dual.Subventions_Pessimiste_Euros > dual.Subventions_Optimiste_Euros
  ) {
    issues.push({
      field: 'Fourchette_ordre',
      msg: 'Ordre fourchette incohérent (pessimiste doit être ≤ optimiste)',
    });
  }

  return {
    codeUai: row.Code_UAI,
    nom: row.Nom_Ecole,
    commune: row.Commune,
    surface,
    year,
    grade,
    rawConso,
    consoSpec,
    prixKwh,
    expectedCapex,
    pop,
    partFonds: pes.Part_Fonds_Euros,
    gainNet: gainNetPes,
    gainNetOpt: opt.Gain_Net_Annuel_Mairie_Euros,
    fondsRoi: fondsRoiPes,
    financeStatutPreEpci,
    issues,
  };
}

function auditEpciFields(row, epciExpected) {
  const issues = [];
  if (!epciExpected) return issues;

  const epciChecks = [
    ['Financement_Statut', String(row.Financement_Statut ?? ''), epciExpected.Financement_Statut, 0],
    ['Package_ID', String(row.Package_ID ?? ''), String(epciExpected.Package_ID ?? ''), 0],
    ['Code_EPCI', String(row.Code_EPCI ?? ''), String(epciExpected.Code_EPCI ?? ''), 0],
    ['Pack_CAPEX_Total', num(row.Pack_CAPEX_Total), epciExpected.Pack_CAPEX_Total, TOLERANCE_EUR],
    ['Pack_Gain_Net_Pessimiste_Total', num(row.Pack_Gain_Net_Pessimiste_Total), epciExpected.Pack_Gain_Net_Pessimiste_Total, TOLERANCE_EUR],
  ];

  for (const [field, actual, expected, tol] of epciChecks) {
    if (field === 'Financement_Statut' || field === 'Package_ID' || field === 'Code_EPCI') {
      if (actual !== expected) {
        issues.push({ field, actual, expected });
      }
      continue;
    }
    if (!near(actual, expected, tol)) {
      issues.push({ field, actual, expected, delta: actual != null && expected != null ? actual - expected : null });
    }
  }

  return issues;
}

async function main() {
  await initPrixKwhMoyenTertiaire();

  const csvPath = path.resolve(process.cwd(), process.argv[2] ?? config.outputFile);
  const raw = await fs.readFile(csvPath, 'utf8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, bom: true, relax_quotes: true });

  const populationMaps = await loadPopulationMaps();
  const populationByInsee = new Map(populationMaps.byInsee);

  await ensureEpciMapping();
  const epciMapping = getEpciMappingSync();

  const partialResults = rows.map((row) => auditRow(row, populationByInsee));
  const preEpciRows = rows.map((row, i) => ({
    ...row,
    Financement_Statut: partialResults[i].financeStatutPreEpci,
  }));
  const epciExpectedRows = generateFinancialPackages(
    preEpciRows.map((r) => ({ ...r })),
    { epciMapping },
  );
  const epciByUai = new Map(epciExpectedRows.map((r) => [r.Code_UAI, r]));

  const results = partialResults.map((result, i) => ({
    ...result,
    issues: [
      ...result.issues,
      ...auditEpciFields(rows[i], epciByUai.get(rows[i].Code_UAI)),
    ],
  }));
  const withIssues = results.filter((r) => r.issues.length > 0);
  const ok = results.length - withIssues.length;

  const byField = {};
  for (const r of withIssues) {
    for (const i of r.issues) {
      byField[i.field] = (byField[i.field] ?? 0) + 1;
    }
  }

  const stats = {
    total: results.length,
    ok,
    errors: withIssues.length,
    financement: {},
    package: {},
    gainNetNegative: results.filter((r) => r.gainNet <= 0).length,
    gainNetPositive: results.filter((r) => r.gainNet > 0).length,
    finançableSoloPossible: results.filter(
      (r) =>
        r.gainNet > 0 &&
        r.partFonds >= config.finance.minPartFondsSolo &&
        r.fondsRoi != null &&
        r.fondsRoi <= config.finance.maxFondsRoiYearsSolo,
    ).length,
    avgPartFonds: Math.round(results.reduce((s, r) => s + r.partFonds, 0) / results.length),
    avgGainNet: Math.round(results.reduce((s, r) => s + r.gainNet, 0) / results.length),
    avgGainNetOpt: Math.round(results.reduce((s, r) => s + (r.gainNetOpt ?? 0), 0) / results.length),
    prixKwh: config.getPrixKwhTertiaire(),
    objectifGainCpe: config.cpe.objectifGainCpe,
    minPartFondsSolo: config.finance.minPartFondsSolo,
    minPackagePartFonds: config.finance.minPackagePartFonds,
    maxFondsRoiYearsSolo: config.finance.maxFondsRoiYearsSolo,
  };

  for (const row of rows) {
    stats.financement[row.Financement_Statut] = (stats.financement[row.Financement_Statut] ?? 0) + 1;
    const pkg = String(row.Package_ID ?? '');
    const key = pkg.startsWith('EPCI-') ? 'EPCI' : pkg.startsWith('PKG-') ? 'PKG' : pkg.startsWith('DRAFT-') ? 'DRAFT' : pkg;
    stats.package[key] = (stats.package[key] ?? 0) + 1;
  }

  console.log('\n=== AUDIT CALCULS CLIM-ÉCOLE (fourchette + regroupement EPCI) ===\n');
  console.log(`Fichier: ${csvPath}`);
  console.log(`Lignes: ${stats.total}`);
  console.log(`✓ Cohérentes: ${stats.ok}`);
  console.log(`✗ Écarts: ${stats.errors}`);
  console.log('\n--- Paramètres actifs ---');
  console.log(JSON.stringify(
    {
      prixKwh: stats.prixKwh,
      objectifGainCpe: stats.objectifGainCpe,
      modeleFinancement: 'fourchette',
      scenarios: config.finance.scenarios,
      adaptive: config.finance.adaptive,
      minPartFondsSolo: stats.minPartFondsSolo,
      minPackagePartFonds: stats.minPackagePartFonds,
      maxFondsRoiYearsSolo: stats.maxFondsRoiYearsSolo,
    },
    null,
    2,
  ));
  console.log('\n--- Répartition ---');
  console.log('Financement:', stats.financement);
  console.log('Packages:', stats.package);
  console.log(`Gain net pessimiste ≤ 0: ${stats.gainNetNegative} | > 0: ${stats.gainNetPositive}`);
  console.log(`Éligibles FINANÇABLE_SOLO (formule pessimiste): ${stats.finançableSoloPossible}`);
  console.log(`Part fonds moyenne: ${stats.avgPartFonds} € | Gain net moyen (pessimiste): ${stats.avgGainNet} € | optimiste: ${stats.avgGainNetOpt} €`);

  if (Object.keys(byField).length) {
    console.log('\n--- Écarts par champ ---');
    console.log(byField);
  }

  if (withIssues.length) {
    console.log('\n--- Détail des 10 premiers écarts ---');
    for (const r of withIssues.slice(0, 10)) {
      console.log(`\n${r.codeUai} ${r.nom} (${r.commune})`);
      for (const i of r.issues) {
        console.log(`  • ${i.field}: CSV=${i.actual ?? '—'} attendu=${i.expected ?? i.msg ?? '—'} Δ=${i.delta ?? ''}`);
      }
    }
  }

  const reportPath = path.join(config.cacheDir, 'audit-calculations.json');
  await fs.mkdir(config.cacheDir, { recursive: true });
  await fs.writeFile(
    reportPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), stats, byField, samples: withIssues.slice(0, 30) }, null, 2),
  );
  console.log(`\nRapport JSON: ${reportPath}\n`);

  process.exit(withIssues.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
