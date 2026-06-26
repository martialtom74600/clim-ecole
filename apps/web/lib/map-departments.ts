import type { MarketplacePack } from './types';
import { parseDepartmentCode } from './geo';
import { getDeptCentroid, getDeptLabel } from './geo-france';
import type { DepartmentMarker } from './map-utils';

/** Agrège les packs par département — positions fixes, pas de GPS école (client-safe) */
export function buildDepartmentMarkers(packs: MarketplacePack[]): DepartmentMarker[] {
  const byDept = new Map<string, {
    department: string;
    territoryCount: number;
    totalCapex: number;
    schoolCount: number;
    qualifiedCount: number;
  }>();

  for (const pack of packs) {
    const code = parseDepartmentCode(pack.department);
    const existing = byDept.get(code);
    if (existing) {
      existing.territoryCount += 1;
      existing.totalCapex += pack.packCapexTotal;
      existing.schoolCount += pack.batimentCount;
      if (pack.isQualified) existing.qualifiedCount += 1;
    } else {
      byDept.set(code, {
        department: pack.department,
        territoryCount: 1,
        totalCapex: pack.packCapexTotal,
        schoolCount: pack.batimentCount,
        qualifiedCount: pack.isQualified ? 1 : 0,
      });
    }
  }

  const markers: DepartmentMarker[] = [];

  for (const [code, agg] of byDept) {
    const centroid = getDeptCentroid(code);
    if (!centroid) continue;
    const label = getDeptLabel(code);
    markers.push({
      id: code,
      department: label ? `${code} · ${label}` : agg.department,
      lat: centroid[0],
      lon: centroid[1],
      territoryCount: agg.territoryCount,
      totalCapex: agg.totalCapex,
      schoolCount: agg.schoolCount,
      qualifiedCount: agg.qualifiedCount,
    });
  }

  return markers.sort((a, b) => b.totalCapex - a.totalCapex);
}
