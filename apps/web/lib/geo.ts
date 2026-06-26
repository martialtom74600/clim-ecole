/** Départements Auvergne-Rhône-Alpes */
export const AURA_DEPT_LABELS: Record<string, string> = {
  '01': 'Ain',
  '03': 'Allier',
  '07': 'Ardèche',
  '15': 'Cantal',
  '26': 'Drôme',
  '38': 'Isère',
  '42': 'Loire',
  '43': 'Haute-Loire',
  '63': 'Puy-de-Dôme',
  '69': 'Rhône',
  '73': 'Savoie',
  '74': 'Haute-Savoie',
};

/** Centroïdes fixes par département — jamais dérivés des coordonnées écoles */
export const AURA_DEPT_CENTROIDS: Record<string, [number, number]> = {
  '01': [46.05, 5.33],
  '03': [46.34, 3.42],
  '07': [44.75, 4.45],
  '15': [45.03, 2.72],
  '26': [44.73, 5.18],
  '38': [45.19, 5.72],
  '42': [45.77, 4.39],
  '43': [45.04, 3.88],
  '63': [45.78, 3.08],
  '69': [45.76, 4.84],
  '73': [45.56, 6.33],
  '74': [46.04, 6.45],
};

export function parseDepartmentCode(department: string): string {
  return department.split('·')[0]?.trim() ?? department.trim();
}

export function deptCodeFromInsee(codeInsee: string): string {
  const c = codeInsee.trim();
  if (c.startsWith('2A') || c.startsWith('2B')) return c.slice(0, 2).toUpperCase();
  return c.slice(0, 2);
}

export function formatDepartment(codeInsee: string): string {
  const dept = deptCodeFromInsee(codeInsee);
  const label = AURA_DEPT_LABELS[dept];
  return label ? `${dept} · ${label}` : `Dept. ${dept}`;
}

export function dominantDepartment(codesInsee: string[]): string {
  if (!codesInsee.length) return 'AURA';
  const counts = new Map<string, number>();
  for (const c of codesInsee) {
    const d = deptCodeFromInsee(c);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  let bestDept = '';
  let bestCount = 0;
  for (const [dept, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestDept = dept;
    }
  }
  const label = AURA_DEPT_LABELS[bestDept];
  return label ? `${bestDept} · ${label}` : `Dept. ${bestDept}`;
}
