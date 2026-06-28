export function capexToRadius(capex: number, min = 10, max = 28): number {
  const c = Math.max(200_000, Math.min(capex, 5_000_000));
  const t = (Math.log(c) - Math.log(200_000)) / (Math.log(5_000_000) - Math.log(200_000));
  return Math.round(min + t * (max - min));
}

/** Agrégat département — seule vue carte autorisée sans achat */
export interface DepartmentMarker {
  id: string;
  department: string;
  lat: number;
  lon: number;
  territoryCount: number;
  totalCapex: number;
  schoolCount: number;
  qualifiedCount: number;
}

export const FRANCE_CENTER: [number, number] = [46.6, 2.4];
export const DEFAULT_ZOOM = 6;
