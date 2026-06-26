/**
 * Centroïdes départements France — AURA précis, autres approximatifs stables.
 */
import { AURA_DEPT_CENTROIDS, AURA_DEPT_LABELS } from './geo';

/** Centroïdes additionnels (approx. préfecture) */
const EXTRA_CENTROIDS: Record<string, [number, number]> = {
  '02': [49.56, 3.62],
  '04': [44.09, 6.23],
  '05': [44.56, 6.08],
  '06': [43.93, 7.26],
  '08': [49.77, 4.72],
  '10': [48.30, 4.08],
  '11': [43.21, 2.35],
  '12': [44.35, 2.57],
  '13': [43.30, 5.37],
  '14': [49.18, -0.37],
  '16': [45.65, 0.16],
  '17': [45.75, -0.64],
  '18': [47.08, 2.40],
  '19': [45.27, 1.77],
  '21': [47.32, 5.04],
  '22': [48.51, -2.76],
  '23': [46.17, 1.87],
  '24': [45.18, 0.72],
  '25': [47.24, 6.02],
  '27': [49.02, 1.15],
  '28': [48.45, 1.48],
  '29': [48.00, -4.10],
  '30': [43.84, 4.36],
  '31': [43.60, 1.44],
  '32': [43.65, 0.58],
  '33': [44.84, -0.58],
  '34': [43.61, 3.87],
  '35': [48.11, -1.68],
  '36': [46.81, 1.69],
  '37': [47.39, 0.69],
  '39': [46.67, 5.55],
  '40': [43.89, -0.50],
  '41': [47.59, 1.34],
  '44': [47.22, -1.55],
  '45': [47.90, 1.90],
  '46': [44.45, 1.44],
  '47': [44.20, 0.62],
  '48': [44.52, 3.50],
  '49': [47.47, -0.55],
  '50': [49.11, -1.09],
  '51': [49.04, 4.03],
  '52': [48.11, 5.14],
  '53': [48.07, -0.77],
  '54': [48.69, 6.18],
  '55': [49.12, 5.38],
  '56': [47.75, -2.76],
  '57': [49.12, 6.18],
  '58': [47.00, 3.15],
  '59': [50.37, 3.08],
  '60': [49.42, 2.83],
  '61': [48.43, 0.09],
  '62': [50.29, 2.78],
  '64': [43.30, -0.37],
  '65': [43.23, 0.08],
  '66': [42.70, 2.89],
  '67': [48.58, 7.75],
  '68': [47.75, 7.34],
  '75': [48.86, 2.35],
  '76': [49.44, 1.09],
  '77': [48.54, 2.65],
  '78': [48.80, 2.13],
  '79': [46.32, -0.46],
  '80': [49.89, 2.30],
  '81': [43.93, 2.15],
  '82': [44.02, 1.35],
  '83': [43.12, 6.13],
  '84': [44.05, 5.05],
  '85': [46.67, -1.43],
  '86': [46.58, 0.34],
  '87': [45.83, 1.26],
  '88': [48.17, 6.45],
  '89': [47.80, 3.57],
  '90': [47.63, 6.86],
  '91': [48.53, 2.25],
  '92': [48.90, 2.21],
  '93': [48.91, 2.48],
  '94': [48.79, 2.46],
  '95': [49.05, 2.10],
  '2A': [41.93, 8.74],
  '2B': [42.40, 9.21],
};

const EXTRA_LABELS: Record<string, string> = {
  '02': 'Aisne', '04': 'Alpes-de-Haute-Provence', '05': 'Hautes-Alpes', '06': 'Alpes-Maritimes',
  '08': 'Ardennes', '10': 'Aube', '11': 'Aude', '12': 'Aveyron', '13': 'Bouches-du-Rhône',
  '14': 'Calvados', '16': 'Charente', '17': 'Charente-Maritime', '18': 'Cher', '19': 'Corrèze',
  '21': 'Côte-d\'Or', '22': 'Côtes-d\'Armor', '23': 'Creuse', '24': 'Dordogne', '25': 'Doubs',
  '27': 'Eure', '28': 'Eure-et-Loir', '29': 'Finistère', '30': 'Gard', '31': 'Haute-Garonne',
  '32': 'Gers', '33': 'Gironde', '34': 'Hérault', '35': 'Ille-et-Vilaine', '36': 'Indre',
  '37': 'Indre-et-Loire', '39': 'Jura', '40': 'Landes', '41': 'Loir-et-Cher', '44': 'Loire-Atlantique',
  '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne', '48': 'Lozère', '49': 'Maine-et-Loire',
  '50': 'Manche', '51': 'Marne', '52': 'Haute-Marne', '53': 'Mayenne', '54': 'Meurthe-et-Moselle',
  '55': 'Meuse', '56': 'Morbihan', '57': 'Moselle', '58': 'Nièvre', '59': 'Nord', '60': 'Oise',
  '61': 'Orne', '62': 'Pas-de-Calais', '64': 'Pyrénées-Atlantiques', '65': 'Hautes-Pyrénées',
  '66': 'Pyrénées-Orientales', '67': 'Bas-Rhin', '68': 'Haut-Rhin', '75': 'Paris',
  '76': 'Seine-Maritime', '77': 'Seine-et-Marne', '78': 'Yvelines', '79': 'Deux-Sèvres',
  '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne', '83': 'Var', '84': 'Vaucluse',
  '85': 'Vendée', '86': 'Vienne', '87': 'Haute-Vienne', '88': 'Vosges', '89': 'Yonne',
  '90': 'Territoire de Belfort', '91': 'Essonne', '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis',
  '94': 'Val-de-Marne', '95': 'Val-d\'Oise', '2A': 'Corse-du-Sud', '2B': 'Haute-Corse',
};

export const FR_DEPT_CENTROIDS: Record<string, [number, number]> = {
  ...EXTRA_CENTROIDS,
  ...AURA_DEPT_CENTROIDS,
};

export const FR_DEPT_LABELS: Record<string, string> = {
  ...EXTRA_LABELS,
  ...AURA_DEPT_LABELS,
};

export function normalizeDeptCode(code: string): string {
  const c = code.trim();
  if (/^2[ABab]$/.test(c)) return c.toUpperCase();
  const n = c.replace(/^0+/, '') || c;
  return n.length <= 2 ? n.padStart(2, '0') : c;
}

export function getDeptCentroid(code: string): [number, number] | null {
  const keys = [code, normalizeDeptCode(code), code.padStart(3, '0')];
  for (const k of keys) {
    if (FR_DEPT_CENTROIDS[k]) return FR_DEPT_CENTROIDS[k];
  }
  return null;
}

export function getDeptLabel(code: string): string | null {
  const keys = [code, normalizeDeptCode(code), code.padStart(3, '0')];
  for (const k of keys) {
    if (FR_DEPT_LABELS[k]) return FR_DEPT_LABELS[k];
  }
  return null;
}

export const FRANCE_CENTER: [number, number] = [46.6, 2.4];
