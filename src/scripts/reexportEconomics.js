/**
 * Recalcule économies + finance depuis le checkpoint → CSV (sans re-scrape API).
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
import { filterEetExportRows, validateEetConfig } from '../services/patrimoineFilter.js';
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

export async function reexportEconomicsToFile(outputPath) {
  await initPrixKwhMoyenTertiaire();
  validateEetConfig();

  const checkpoint = await loadCheckpoint(config.departments);
  if (!checkpoint.results?.length) {
    throw new Error('Checkpoint vide — pipeline complet requis avant reexport');
  }

  const { kept, removed } = filterEetExportRows(checkpoint.results);
  checkpoint.results = kept;
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

  const absOutput = path.isAbsolute(outputPath)
    ? outputPath
    : path.resolve(process.cwd(), outputPath);

  await exportProspectionCsv(checkpoint.results, absOutput);
  await saveCheckpoint(checkpoint);

  return { rowCount: checkpoint.results.length, removed };
}

async function main() {
  const outputPath = path.isAbsolute(config.outputFile)
    ? config.outputFile
    : path.resolve(process.cwd(), config.outputFile);
  const { rowCount, removed } = await reexportEconomicsToFile(outputPath);
  console.log(`✓ ${rowCount} lignes exportées (${removed} retirées EET) → ${outputPath}`);
}

const isDirectRun = process.argv[1]
  && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
