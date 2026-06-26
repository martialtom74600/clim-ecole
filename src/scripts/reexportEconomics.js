/**
 * Recalcule économies + finance + MGPE depuis le checkpoint sans re-scraper les APIs.
 * Purge les lignes hors Sweet Spot EET (filtre sémantique + surface).
 * Usage : node src/scripts/reexportEconomics.js
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import { loadCheckpoint, saveCheckpoint, syncCheckpointStats } from '../utils/checkpoint.js';
import { enrichRowWithFinance } from '../finance/financeProcessor.js';
import { generateFinancialPackages } from '../finance/poolingEngine.js';
import { ensureEpciMapping } from '../services/epciMappingService.js';
import { exportProspectionCsv } from '../export/csvExporter.js';
import { recalculateRowEnergyEconomics } from '../finance/energyEconomics.js';
import { attachIndustrialProfile } from '../industrial/index.js';
import { resolveSchoolCoordinates } from '../dashboard/schoolCoordsService.js';
import { loadPopulationMaps } from '../dashboard/populationCache.js';
import { filterEetExportRows, formatEetFilterLog, validateEetConfig } from '../services/patrimoineFilter.js';

import { initPrixKwhMoyenTertiaire } from '../services/energyPriceService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function reconcileCheckpointSchoolsAfterEetPurge(checkpoint) {
  const kept = new Set(checkpoint.results.map((row) => row.Code_UAI));
  for (const [uai, state] of Object.entries(checkpoint.schools ?? {})) {
    if (state.outcome === 'exported' && !kept.has(uai)) {
      checkpoint.schools[uai] = {
        ...state,
        outcome: 'filtered',
        filterReason: 'eet_reexport',
        updatedAt: new Date().toISOString(),
      };
    }
  }
  syncCheckpointStats(checkpoint);
}

async function main() {
  await initPrixKwhMoyenTertiaire();
  validateEetConfig();
  console.log(`Prix kWh tertiaire : ${config.getPrixKwhTertiaire()} € (${config.cpe.prixKwhSource})`);
  console.log(
    `Filtre EET — surface min ${config.eet.eligibleSurfaceMin} m², `
    + `${config.eet.eligiblePublicKeywords.length} mots-clés éligibles, `
    + `${config.eet.bannedPublicKeywords.length} mots-clés exclus`,
  );

  const checkpoint = await loadCheckpoint(config.departments);
  if (!checkpoint.results?.length) {
    console.error('Aucun résultat dans le checkpoint — lancez d\'abord le pipeline.');
    process.exit(1);
  }

  const beforeCount = checkpoint.results.length;

  const { kept, removed, rejections } = filterEetExportRows(checkpoint.results, {
    onReject: (row, evaluation) => {
      console.log(`  ${formatEetFilterLog(evaluation)} — ${row.Nom_Ecole?.slice(0, 60)} (${row.Commune})`);
    },
  });
  checkpoint.results = kept;

  console.log(`Filtre EET appliqué : ${removed} ligne(s) retirée(s), ${checkpoint.results.length}/${beforeCount} conservée(s)`);

  reconcileCheckpointSchoolsAfterEetPurge(checkpoint);

  const populationMaps = await loadPopulationMaps();
  const populationByInsee = populationMaps.byInsee;

  const recalculated = checkpoint.results.map((row) =>
    recalculateRowEnergyEconomics(attachIndustrialProfile(row)),
  );

  const enriched = recalculated.map((row) => enrichRowWithFinance(row, populationByInsee));
  const withCoords = await resolveSchoolCoordinates(enriched);
  const epciMapping = await ensureEpciMapping();
  checkpoint.results = generateFinancialPackages(withCoords, { epciMapping });

  const outputPath = path.isAbsolute(config.outputFile)
    ? config.outputFile
    : path.resolve(process.cwd(), config.outputFile);

  await exportProspectionCsv(checkpoint.results, outputPath);
  await saveCheckpoint(checkpoint);

  const roche = checkpoint.results.filter((r) => String(r.Code_INSEE) === '74224');
  const totalEco = roche.reduce((s, r) => s + (r.Economie_Annuelle_Euros ?? 0), 0);
  const totalCapex = roche.reduce((s, r) => s + (r.CAPEX_Total ?? 0), 0);

  console.log(`✓ ${checkpoint.results.length} lignes exportées → ${outputPath}`);
  console.log(`  La Roche-sur-Foron : ${roche.length} écoles, CAPEX ${totalCapex} €, économies ${totalEco} €/an`);
  for (const r of roche) {
    console.log(
      `    · ${r.Nom_Ecole?.slice(0, 40)} : ${r.Conso_Specifique_kWh_M2} kWh/m², facture ${r.Facture_Annuelle_Euros} €, éco ${r.Economie_Annuelle_Euros} €, Lt ${r.MGPE_Loyer_Lt_Euros} €`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
