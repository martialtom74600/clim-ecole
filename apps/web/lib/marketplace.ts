import { cache } from 'react';
import { getAllEpciSummary, getDashboardKpis, getEpciByCode, getEpciAccumulatorMap, getCsvSyncMeta } from './data';
import { dominantDepartment } from './geo-france';
import { getCoverageBadge } from './coverage';
import { explainDealPersona, inferDealPersona } from './persona-engine';
import { computeRadarScore } from './radar-score';
import { checkPackEntitlement, getPackUnlockCountsMap, type PackAvailability } from './entitlements';
import { buildTerritoryFreePreview, formatBudgetRange, formatSubventionLevel, getBudgetBand } from './freemium';
import { isTestMode } from './test-mode';
import { isQualifiedDeal } from './curated-deals';
import { getMaxUnlocksPerPack } from './pack-config';
import type {
  ClosingLevel,
  MarketplaceBuilding,
  MarketplaceGlobalStats,
  MarketplacePack,
  MarketplacePackDetail,
  ProspectRow,
} from './types';
import { buildMgpeSummary, resteAChargeAfterSubs } from './dossier-helpers';
import { getTerritoryTenderSignal, getTerritoryTenderSignalsMap } from './territory-tenders';
import { decodePackId, encodePackId } from './pack-id';

export { decodePackId, encodePackId };

function obfuscatePackName(regionLabel = 'France'): string {
  return `Collectivité · ${regionLabel}`;
}

function obfuscateBuildingName(): string {
  return '*****';
}

function obfuscateCommune(sectorIndex: number, regionLabel = 'France'): string {
  const sectors = ['Nord', 'Est', 'Sud', 'Ouest', 'Centre'];
  return `Secteur ${sectors[sectorIndex % sectors.length]} · ${regionLabel.split(' · ')[0]}`;
}

function bestRoiAnnees(buildings: { fondsRoiPessimisteAnnees: number }[]): number {
  const valid = buildings
    .map((b) => b.fondsRoiPessimisteAnnees)
    .filter((v) => Number.isFinite(v) && v > 0);
  if (!valid.length) return 0;
  return Math.min(...valid);
}

function sumFondsVert(buildings: { partFondsPessimisteEuros: number }[]): number {
  return buildings.reduce((s, b) => s + (b.partFondsPessimisteEuros || 0), 0);
}

function packAvailabilityFromMap(
  packId: string,
  counts: Map<string, number>,
): PackAvailability {
  const max = getMaxUnlocksPerPack();
  const used = counts.get(packId) ?? 0;
  const remaining = Math.max(0, max - used);
  return { max, used, remaining, soldOut: remaining <= 0 };
}

function toMarketplacePack(
  summary: Awaited<ReturnType<typeof getAllEpciSummary>>[number],
  detail: NonNullable<Awaited<ReturnType<typeof getEpciByCode>>>,
  sortIndex: number,
  unlocked: boolean,
  coverageLabel: string,
  availability: PackAvailability,
  tender?: { hasActiveTender: boolean; tenderTitle?: string },
): MarketplacePack {
  const roiAnnees = bestRoiAnnees(detail.batiments);
  const personaResult = inferDealPersona({
    packCapexTotal: detail.packCapexTotal,
    subventionsTotal: detail.subventionsTotal,
    statutProjetEpci: summary.statutProjetEpci,
    batiments: detail.batiments.map((b) => ({
      classeDpe: b.classeDpe,
      surfaceM2: b.surfaceM2,
    })),
  });

  const radar = computeRadarScore({
    packCapexTotal: detail.packCapexTotal,
    subventionRatio: personaResult.subventionRatio,
    passoireRatio: personaResult.passoireRatio,
    temperatureLevel: summary.temperatureLevel,
    statutProjetEpci: summary.statutProjetEpci,
    roiAnnees,
    batimentCount: summary.batimentCount,
  });

  const packId = encodePackId(summary.codeEpci);
  const regionShort = coverageLabel.includes('régions') ? 'France' : coverageLabel.split(' · ')[0];

  const base = {
    packId,
    publicName: unlocked ? detail.displayName : obfuscatePackName(regionShort),
    publicZone: regionShort,
    department: dominantDepartment(detail.batiments.map((b) => b.codeInsee)),
    batimentCount: summary.batimentCount,
    packCapexTotal: detail.packCapexTotal,
    resteAChargeTotal: detail.resteAChargeTotal,
    subventionsTotal: detail.subventionsTotal,
    fondsVertPotential: sumFondsVert(detail.batiments),
    gainNetMairieTotal: detail.gainNetMairieTotal,
    roiAnnees,
    subventionRatio: personaResult.subventionRatio,
    temperatureLevel: summary.temperatureLevel,
    statutProjetEpci: summary.statutProjetEpci,
    financialsHidden: !unlocked,
    isHot:
      summary.temperatureLevel === 'chaud' ||
      detail.packCapexTotal >= 1_000_000 ||
      summary.statutProjetEpci === 'PROJET_GLOBAL_VALIDE',
    isNew: sortIndex < 8,
    personas: personaResult.personas,
    primaryPersona: personaResult.primaryPersona,
    radarScore: radar.score,
    radarGrade: radar.grade,
    slotsRemaining: availability.remaining,
    slotsMax: availability.max,
    soldOut: availability.soldOut,
    hasActiveTender: Boolean(tender?.hasActiveTender),
    tenderTitle: tender?.tenderTitle,
  };

  return {
    ...base,
    budgetRange: formatBudgetRange(detail.packCapexTotal),
    subventionLevelLabel: formatSubventionLevel(personaResult.subventionRatio),
    isQualified: isQualifiedDeal(base),
  };
}

/** Retire les € exacts et signaux fins du payload client (gratuit). */
function redactPackFinancials(pack: MarketplacePack): MarketplacePack {
  if (!pack.financialsHidden) return pack;
  return {
    ...pack,
    packCapexTotal: 0,
    resteAChargeTotal: 0,
    subventionsTotal: 0,
    fondsVertPotential: 0,
    gainNetMairieTotal: 0,
    roiAnnees: 0,
    subventionRatio: 0,
    radarScore: 0,
    isHot: false,
    temperatureLevel: 'froid',
    statutProjetEpci: 'SOUS_SEUIL_A_CREUSER',
    personas: pack.primaryPersona ? [pack.primaryPersona] : [],
  };
}

const GRADE_SORT: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };
const BAND_SORT: Record<string, number> = { xl: 5, l: 4, m: 3, s: 2, xs: 1 };

function sortPacksForPublicList(packs: MarketplacePack[]): MarketplacePack[] {
  return [...packs].sort((a, b) => {
    const g =
      (GRADE_SORT[b.radarGrade] ?? 0) - (GRADE_SORT[a.radarGrade] ?? 0);
    if (g !== 0) return g;
    return (
      (BAND_SORT[getBudgetBand(b.packCapexTotal)] ?? 0) -
      (BAND_SORT[getBudgetBand(a.packCapexTotal)] ?? 0)
    );
  });
}

function encodeBuildingId(packId: string, index: number): string {
  return Buffer.from(`clim-bld:${packId}:${index}`, 'utf8').toString('base64url');
}

function toMarketplaceBuilding(
  packId: string,
  index: number,
  b: ProspectRow,
  unlocked: boolean,
  regionShort = 'France',
): MarketplaceBuilding {
  if (!unlocked) {
    return {
      buildingId: encodeBuildingId(packId, index),
      publicName: obfuscateBuildingName(),
      publicCommune: obfuscateCommune(index, regionShort),
      surfaceM2: 0,
      classeDpe: '?',
      capexTotal: 0,
      resteACharge: 0,
      gainNetMairie: 0,
      roiAnnees: 0,
      closingTemperature: '',
      detailsHidden: true,
    };
  }

  const subs = b.subventionsPessimisteEuros || 0;

  return {
    buildingId: encodeBuildingId(packId, index),
    publicName: b.nomEcole,
    publicCommune: b.commune,
    surfaceM2: b.surfaceM2,
    classeDpe: b.classeDpe,
    capexTotal: b.capexTotal,
    resteACharge: b.partFondsPessimisteEuros,
    gainNetMairie: b.gainNetAnnuelMairieEuros,
    roiAnnees: b.fondsRoiPessimisteAnnees,
    closingTemperature: b.closingTemperature,
    realName: b.nomEcole,
    realCommune: b.commune,
    emailMairie: b.emailMairie || undefined,
    emailMissing: !b.emailMairie?.trim(),
    alerteSurdimensionnement: b.alerteSurdimensionnement,
    partFondsVert: b.partFondsPessimisteEuros,
    resteAChargeAfterSubs: resteAChargeAfterSubs(b.capexTotal, subs),
    codeUai: b.codeUai,
    typeTravaux: b.typeTravaux || undefined,
    puissancePacKw: b.puissancePacKw || undefined,
    dureeEstimeeSemaines: b.dureeEstimeeSemaines || undefined,
    periodeIdealeChantier: b.periodeIdealeChantier || undefined,
    alerteFinancement: b.alerteFinancement || undefined,
    alerteSurdimensionnementNote: b.alerteSurdimensionnementNote || undefined,
    factureAnnuelleEuros: b.factureAnnuelleEuros || undefined,
    consoSpecifiqueKwhM2: b.consoSpecifiqueKwhM2 || undefined,
    anneeDpe: b.anneeDpe || undefined,
    scoreEligibiliteClosing: b.scoreEligibiliteClosing || undefined,
    artisanNom: b.artisanNom || undefined,
    artisanEmail: b.artisanEmail || undefined,
    artisanDistanceKm: b.artisanDistanceKm || undefined,
    artisanEffectifLabel: b.artisanEffectifLabel || undefined,
    latitude: b.latitude,
    longitude: b.longitude,
  };
}

export const getMarketplaceGlobalStats = cache(async (): Promise<MarketplaceGlobalStats> => {
  const packs = await getMarketplacePacks();
  const [kpis] = await Promise.all([getDashboardKpis()]);

  let totalPackCapex = 0;
  let totalResteACharge = 0;
  let totalSubventions = 0;
  let totalGainMairie = 0;

  for (const p of packs) {
    totalPackCapex += p.packCapexTotal;
    totalResteACharge += p.resteAChargeTotal;
    totalSubventions += p.subventionsTotal;
    totalGainMairie += p.gainNetMairieTotal;
  }

  return {
    totalPackCapex,
    totalBatiments: kpis.totalBatiments,
    epciCount: packs.length,
    qualifiedCount: packs.filter((p) => p.isQualified).length,
    leadsChauds: kpis.leadsChauds,
    totalResteACharge,
    totalSubventions,
    totalGainMairie,
  };
});

export const getMarketplacePacks = cache(async (): Promise<MarketplacePack[]> => {
  const [coverageLabel, summaries, unlockCounts, accMap, tenderMap] = await Promise.all([
    getCoverageBadge(),
    getAllEpciSummary(),
    getPackUnlockCountsMap(),
    getEpciAccumulatorMap(),
    getTerritoryTenderSignalsMap(),
  ]);
  const previewAll = isTestMode();
  const packs: MarketplacePack[] = [];

  for (const summary of summaries) {
    const acc = accMap.get(summary.codeEpci);
    if (!acc) continue;
    const tender = tenderMap.get(summary.codeEpci);
    const detail = {
      codeEpci: acc.codeEpci,
      nomEpci: acc.nomEpci,
      displayName: summary.displayName,
      communesLabel: summary.communesLabel,
      packCapexTotal: acc.packCapexTotal,
      subventionsTotal: acc.subventionsTotal,
      resteAChargeTotal: acc.resteAChargeTotal,
      gainNetMairieTotal: acc.gainNetMairieTotal,
      temperatureGlobale: summary.temperatureGlobale,
      temperatureLevel: summary.temperatureLevel,
      statutProjetEpci: acc.statutProjetEpci,
      batimentCount: acc.batimentCount,
      batiments: [...acc.batiments].sort((a, b) => b.capexTotal - a.capexTotal),
    };
    const packId = encodePackId(summary.codeEpci);
    packs.push(
      toMarketplacePack(
        summary,
        detail,
        0,
        previewAll,
        coverageLabel,
        packAvailabilityFromMap(packId, unlockCounts),
        tender
          ? { hasActiveTender: tender.hasActiveTender, tenderTitle: tender.tenderTitle }
          : undefined,
      ),
    );
  }

  const sorted = sortPacksForPublicList(packs);

  return sorted.map((pack, i) =>
    previewAll
      ? { ...pack, isNew: i < 8, financialsHidden: false }
      : redactPackFinancials({
          ...pack,
          isNew: i < 8,
          financialsHidden: true,
        }),
  );
});

export const getMarketplacePackById = cache(
  async (
    packId: string,
    accountId?: string | null,
  ): Promise<MarketplacePackDetail | null> => {
    const codeEpci = decodePackId(packId);
    if (!codeEpci) return null;

    const [summaries, detail, unlocked, coverageLabel, unlockCounts, syncMeta, tender] =
      await Promise.all([
      getAllEpciSummary(),
      getEpciByCode(codeEpci),
      checkPackEntitlement(accountId, packId),
      getCoverageBadge(),
      getPackUnlockCountsMap(),
      getCsvSyncMeta(),
      getTerritoryTenderSignal(codeEpci),
    ]);

    const index = summaries.findIndex((s) => s.codeEpci === codeEpci);
    if (index < 0 || !detail) return null;

    const regionShort = coverageLabel.includes('régions') ? 'France' : coverageLabel.split(' · ')[0];
    const pack = toMarketplacePack(
      summaries[index],
      detail,
      index,
      unlocked,
      coverageLabel,
      packAvailabilityFromMap(packId, unlockCounts),
      tender
        ? { hasActiveTender: tender.hasActiveTender, tenderTitle: tender.tenderTitle }
        : undefined,
    );
    const buildings = detail.batiments.map((b, i) =>
      toMarketplaceBuilding(pack.packId, i, b, unlocked, regionShort),
    );

    const personaInput = {
      packCapexTotal: detail.packCapexTotal,
      subventionsTotal: detail.subventionsTotal,
      statutProjetEpci: summaries[index].statutProjetEpci,
      batiments: detail.batiments.map((b) => ({
        classeDpe: b.classeDpe,
        surfaceM2: b.surfaceM2,
      })),
    };

    const radar = computeRadarScore({
      packCapexTotal: detail.packCapexTotal,
      subventionRatio: pack.subventionRatio,
      passoireRatio: inferDealPersona(personaInput).passoireRatio,
      temperatureLevel: summaries[index].temperatureLevel,
      statutProjetEpci: summaries[index].statutProjetEpci,
      roiAnnees: pack.roiAnnees,
      batimentCount: pack.batimentCount,
    });

    return {
      pack: redactPackFinancials(unlocked ? pack : { ...pack, financialsHidden: true }),
      buildings,
      unlocked,
      freePreview: unlocked
        ? undefined
        : buildTerritoryFreePreview({
            packCapexTotal: detail.packCapexTotal,
            subventionRatio: pack.subventionRatio,
            dpeClasses: detail.batiments.map((b) => b.classeDpe),
          }),
      personaExplanations: unlocked ? explainDealPersona(personaInput) : undefined,
      radarFactors: unlocked ? radar.factors : undefined,
      communesLabel: detail.communesLabel,
      nomEpci: detail.nomEpci,
      dataLoadedAt: syncMeta.loadedAt,
      scoreClosingMax: Math.max(...detail.batiments.map((b) => b.scoreEligibiliteClosing || 0), 0),
      financementStatut: detail.batiments[0]?.financementStatut,
      mgpe: unlocked ? buildMgpeSummary(detail.batiments) : undefined,
      resteAChargeAfterSubsTotal: unlocked
        ? resteAChargeAfterSubs(detail.packCapexTotal, detail.subventionsTotal)
        : undefined,
    };
  },
);

export function isHotLevel(level: ClosingLevel): boolean {
  return level === 'chaud';
}
