import { cache } from 'react';
import { getAllEpciSummary, getDashboardKpis, getEpciByCode } from './data';
import { dominantDepartment } from './geo-france';
import { getCoverageBadge } from './coverage';
import { explainDealPersona, inferDealPersona } from './persona-engine';
import { computeRadarScore } from './radar-score';
import { checkPackEntitlement, getPackAvailability } from './entitlements';
import { isQualifiedDeal } from './curated-deals';
import type {
  ClosingLevel,
  MarketplaceBuilding,
  MarketplaceGlobalStats,
  MarketplacePack,
  MarketplacePackDetail,
} from './types';

const PREFIX = 'clim-pack:';

export function encodePackId(codeEpci: string): string {
  return Buffer.from(`${PREFIX}${codeEpci}`, 'utf8').toString('base64url');
}

export function decodePackId(packId: string): string | null {
  try {
    const raw = Buffer.from(packId, 'base64url').toString('utf8');
    if (!raw.startsWith(PREFIX)) return null;
    return raw.slice(PREFIX.length) || null;
  } catch {
    return null;
  }
}

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

async function toMarketplacePack(
  summary: Awaited<ReturnType<typeof getAllEpciSummary>>[number],
  detail: NonNullable<Awaited<ReturnType<typeof getEpciByCode>>>,
  sortIndex: number,
  unlocked = false,
  coverageLabel = 'France',
): Promise<MarketplacePack> {
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
  const availability = await getPackAvailability(packId);
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
  };

  return {
    ...base,
    isQualified: isQualifiedDeal(base),
  };
}

function encodeBuildingId(packId: string, index: number): string {
  return Buffer.from(`clim-bld:${packId}:${index}`, 'utf8').toString('base64url');
}

function toMarketplaceBuilding(
  packId: string,
  index: number,
  b: {
    nomEcole: string;
    commune: string;
    emailMairie: string;
    alerteSurdimensionnement: boolean;
    surfaceM2: number;
    classeDpe: string;
    capexTotal: number;
    partFondsPessimisteEuros: number;
    gainNetAnnuelMairieEuros: number;
    fondsRoiPessimisteAnnees: number;
    closingTemperature: string;
  },
  unlocked: boolean,
  regionShort = 'France',
): MarketplaceBuilding {
  return {
    buildingId: encodeBuildingId(packId, index),
    publicName: unlocked ? b.nomEcole : obfuscateBuildingName(),
    publicCommune: unlocked ? b.commune : obfuscateCommune(index, regionShort),
    surfaceM2: b.surfaceM2,
    classeDpe: b.classeDpe,
    capexTotal: b.capexTotal,
    resteACharge: b.partFondsPessimisteEuros,
    gainNetMairie: b.gainNetAnnuelMairieEuros,
    roiAnnees: b.fondsRoiPessimisteAnnees,
    closingTemperature: b.closingTemperature,
    ...(unlocked && {
      realName: b.nomEcole,
      realCommune: b.commune,
      emailMairie: b.emailMairie || undefined,
      alerteSurdimensionnement: b.alerteSurdimensionnement,
    }),
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
  const coverageLabel = await getCoverageBadge();
  const summaries = await getAllEpciSummary();
  const packs: MarketplacePack[] = [];

  for (const summary of summaries) {
    const detail = await getEpciByCode(summary.codeEpci);
    if (!detail) continue;
    packs.push(await toMarketplacePack(summary, detail, 0, false, coverageLabel));
  }

  const sorted = packs.sort(
    (a, b) => b.radarScore - a.radarScore || b.packCapexTotal - a.packCapexTotal,
  );

  return sorted.map((pack, i) => ({
    ...pack,
    isNew: i < 8,
  }));
});

export const getMarketplacePackById = cache(
  async (
    packId: string,
    accountId?: string | null,
  ): Promise<MarketplacePackDetail | null> => {
    const codeEpci = decodePackId(packId);
    if (!codeEpci) return null;

    const summaries = await getAllEpciSummary();
    const index = summaries.findIndex((s) => s.codeEpci === codeEpci);
    if (index < 0) return null;

    const detail = await getEpciByCode(codeEpci);
    if (!detail) return null;

    const unlocked = await checkPackEntitlement(accountId, packId);
    const coverageLabel = await getCoverageBadge();
    const regionShort = coverageLabel.includes('régions') ? 'France' : coverageLabel.split(' · ')[0];
    const allPacks = await getMarketplacePacks();
    const sortIndex = allPacks.findIndex((p) => p.packId === packId);
    const pack = await toMarketplacePack(
      summaries[index], detail, sortIndex >= 0 ? sortIndex : 0, unlocked, coverageLabel,
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
      pack,
      buildings,
      unlocked,
      personaExplanations: explainDealPersona(personaInput),
      radarFactors: radar.factors,
    };
  },
);

export function isHotLevel(level: ClosingLevel): boolean {
  return level === 'chaud';
}
