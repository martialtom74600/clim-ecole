import { cache } from 'react';
import { unstable_cache } from 'next/cache';
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
import { loadProspectionFromCsv } from './data-csv';
import { loadProspectionFromSupabase } from './data-supabase';
import { isSupabaseConfigured } from './supabase-server';

import {
  isClosingChaud,
  isClosingTiede,
  isClosingFroid,
  temperatureLevel,
} from './data-helpers';

export { isClosingChaud, isClosingTiede, isClosingFroid, temperatureLevel };

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

function accToEpciDetail(acc: EpciAccumulator): EpciDetail {
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
}

const loadProspectionFromSupabaseCached = unstable_cache(
  loadProspectionFromSupabase,
  ['prospection-supabase-v1'],
  { revalidate: 120, tags: ['prospection'] },
);

export const loadProspectionData = cache(async (): Promise<ProspectionDataset> => {
  if (isSupabaseConfigured()) {
    return loadProspectionFromSupabaseCached();
  }
  return loadProspectionFromCsv();
});

/** Index EPCI — construit une seule fois par requête (évite O(n²) sur /explorer). */
export const getEpciAccumulatorMap = cache(async (): Promise<Map<string, EpciAccumulator>> => {
  const { rows } = await loadProspectionData();
  return buildEpciAccumulators(rows);
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
  return [...(await getEpciAccumulatorMap()).values()]
    .map(toEpciSummary)
    .sort((a, b) => b.packCapexTotal - a.packCapexTotal);
});

export const getEpciByCode = cache(async (code: string): Promise<EpciDetail | null> => {
  const acc = (await getEpciAccumulatorMap()).get(code);
  if (!acc) return null;
  return accToEpciDetail(acc);
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
