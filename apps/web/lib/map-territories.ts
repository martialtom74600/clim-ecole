import { cache } from 'react';
import { getMapMarkers } from './data';
import { decodePackId, getMarketplacePacks } from './marketplace';
import type { TerritoryMarker } from './map-utils';

export type { TerritoryMarker } from './map-utils';

export const getTerritoryMarkers = cache(async (): Promise<TerritoryMarker[]> => {
  const [markers, packs] = await Promise.all([getMapMarkers(), getMarketplacePacks()]);

  const packByEpci = new Map<string, (typeof packs)[number]>();
  for (const pack of packs) {
    const codeEpci = decodePackId(pack.packId);
    if (codeEpci) packByEpci.set(codeEpci, pack);
  }

  const byEpci = new Map<string, { lat: number; lon: number; count: number }>();

  for (const m of markers) {
    const existing = byEpci.get(m.codeEpci);
    if (existing) {
      existing.lat += m.lat;
      existing.lon += m.lon;
      existing.count += 1;
    } else {
      byEpci.set(m.codeEpci, { lat: m.lat, lon: m.lon, count: 1 });
    }
  }

  const territories: TerritoryMarker[] = [];

  for (const [codeEpci, centroid] of byEpci) {
    const pack = packByEpci.get(codeEpci);
    if (!pack) continue;

    territories.push({
      id: codeEpci,
      packId: pack.packId,
      lat: centroid.lat / centroid.count,
      lon: centroid.lon / centroid.count,
      capex: pack.packCapexTotal,
      schoolCount: pack.batimentCount,
      isHot: pack.isHot,
      isQualified: pack.isQualified,
      isNew: pack.isNew,
      radarScore: pack.radarScore,
      radarGrade: pack.radarGrade,
      temperatureLevel: pack.temperatureLevel,
      department: pack.department,
      publicName: pack.publicName,
    });
  }

  return territories.sort((a, b) => b.radarScore - a.radarScore);
});
