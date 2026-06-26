import type { ClosingLevel } from './types';

export interface TerritoryMarker {
  id: string;
  packId: string;
  lat: number;
  lon: number;
  capex: number;
  schoolCount: number;
  isHot: boolean;
  isQualified: boolean;
  isNew: boolean;
  radarScore: number;
  radarGrade: 'A' | 'B' | 'C' | 'D';
  temperatureLevel: ClosingLevel;
  department: string;
  publicName: string;
}

export function gradeColor(grade: 'A' | 'B' | 'C' | 'D'): string {
  return { A: '#16A34A', B: '#18181B', C: '#EA580C', D: '#A1A1AA' }[grade];
}

export function dpeColor(classe: string): string {
  const m: Record<string, string> = {
    A: '#16A34A', B: '#22C55E', C: '#EAB308', D: '#F97316',
    E: '#EA580C', F: '#DC2626', G: '#991B1B',
  };
  return m[classe?.charAt(0)?.toUpperCase() ?? ''] ?? '#71717A';
}

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
/** @deprecated Utiliser FRANCE_CENTER */
export const AURA_CENTER = FRANCE_CENTER;
export const DEFAULT_ZOOM = 6;
