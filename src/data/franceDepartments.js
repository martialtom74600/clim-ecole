/** Métropole + Corse — ordre de rotation nightly (101 départements). */

const REGION_BY_DEPT = {
  '001': { slug: 'aura', label: 'Auvergne-Rhône-Alpes' },
  '002': { slug: 'hdf', label: 'Hauts-de-France' },
  '003': { slug: 'aura', label: 'Auvergne-Rhône-Alpes' },
  '004': { slug: 'paca', label: 'Provence-Alpes-Côte d\'Azur' },
  '005': { slug: 'paca', label: 'Provence-Alpes-Côte d\'Azur' },
  '006': { slug: 'paca', label: 'Provence-Alpes-Côte d\'Azur' },
  '007': { slug: 'aura', label: 'Auvergne-Rhône-Alpes' },
  '008': { slug: 'ges', label: 'Grand Est' },
  '009': { slug: 'occ', label: 'Occitanie' },
  '010': { slug: 'ges', label: 'Grand Est' },
  '011': { slug: 'occ', label: 'Occitanie' },
  '012': { slug: 'occ', label: 'Occitanie' },
  '013': { slug: 'paca', label: 'Provence-Alpes-Côte d\'Azur' },
  '014': { slug: 'nor', label: 'Normandie' },
  '015': { slug: 'aura', label: 'Auvergne-Rhône-Alpes' },
  '016': { slug: 'naq', label: 'Nouvelle-Aquitaine' },
  '017': { slug: 'naq', label: 'Nouvelle-Aquitaine' },
  '018': { slug: 'cvl', label: 'Centre-Val de Loire' },
  '019': { slug: 'naq', label: 'Nouvelle-Aquitaine' },
  '021': { slug: 'bfc', label: 'Bourgogne-Franche-Comté' },
  '022': { slug: 'bre', label: 'Bretagne' },
  '023': { slug: 'naq', label: 'Nouvelle-Aquitaine' },
  '024': { slug: 'naq', label: 'Nouvelle-Aquitaine' },
  '025': { slug: 'bfc', label: 'Bourgogne-Franche-Comté' },
  '026': { slug: 'aura', label: 'Auvergne-Rhône-Alpes' },
  '027': { slug: 'nor', label: 'Normandie' },
  '028': { slug: 'cvl', label: 'Centre-Val de Loire' },
  '029': { slug: 'bre', label: 'Bretagne' },
  '030': { slug: 'occ', label: 'Occitanie' },
  '031': { slug: 'occ', label: 'Occitanie' },
  '032': { slug: 'occ', label: 'Occitanie' },
  '033': { slug: 'naq', label: 'Nouvelle-Aquitaine' },
  '034': { slug: 'occ', label: 'Occitanie' },
  '035': { slug: 'bre', label: 'Bretagne' },
  '036': { slug: 'cvl', label: 'Centre-Val de Loire' },
  '037': { slug: 'cvl', label: 'Centre-Val de Loire' },
  '038': { slug: 'aura', label: 'Auvergne-Rhône-Alpes' },
  '039': { slug: 'bfc', label: 'Bourgogne-Franche-Comté' },
  '040': { slug: 'naq', label: 'Nouvelle-Aquitaine' },
  '041': { slug: 'cvl', label: 'Centre-Val de Loire' },
  '042': { slug: 'aura', label: 'Auvergne-Rhône-Alpes' },
  '043': { slug: 'aura', label: 'Auvergne-Rhône-Alpes' },
  '044': { slug: 'pdl', label: 'Pays de la Loire' },
  '045': { slug: 'cvl', label: 'Centre-Val de Loire' },
  '046': { slug: 'occ', label: 'Occitanie' },
  '047': { slug: 'naq', label: 'Nouvelle-Aquitaine' },
  '048': { slug: 'occ', label: 'Occitanie' },
  '049': { slug: 'pdl', label: 'Pays de la Loire' },
  '050': { slug: 'nor', label: 'Normandie' },
  '051': { slug: 'ges', label: 'Grand Est' },
  '052': { slug: 'ges', label: 'Grand Est' },
  '053': { slug: 'pdl', label: 'Pays de la Loire' },
  '054': { slug: 'ges', label: 'Grand Est' },
  '055': { slug: 'ges', label: 'Grand Est' },
  '056': { slug: 'bre', label: 'Bretagne' },
  '057': { slug: 'ges', label: 'Grand Est' },
  '058': { slug: 'bfc', label: 'Bourgogne-Franche-Comté' },
  '059': { slug: 'hdf', label: 'Hauts-de-France' },
  '060': { slug: 'hdf', label: 'Hauts-de-France' },
  '061': { slug: 'nor', label: 'Normandie' },
  '062': { slug: 'hdf', label: 'Hauts-de-France' },
  '063': { slug: 'aura', label: 'Auvergne-Rhône-Alpes' },
  '064': { slug: 'naq', label: 'Nouvelle-Aquitaine' },
  '065': { slug: 'occ', label: 'Occitanie' },
  '066': { slug: 'occ', label: 'Occitanie' },
  '067': { slug: 'ges', label: 'Grand Est' },
  '068': { slug: 'ges', label: 'Grand Est' },
  '069': { slug: 'aura', label: 'Auvergne-Rhône-Alpes' },
  '070': { slug: 'bfc', label: 'Bourgogne-Franche-Comté' },
  '071': { slug: 'bfc', label: 'Bourgogne-Franche-Comté' },
  '072': { slug: 'pdl', label: 'Pays de la Loire' },
  '073': { slug: 'aura', label: 'Auvergne-Rhône-Alpes' },
  '074': { slug: 'aura', label: 'Auvergne-Rhône-Alpes' },
  '075': { slug: 'idf', label: 'Île-de-France' },
  '076': { slug: 'nor', label: 'Normandie' },
  '077': { slug: 'idf', label: 'Île-de-France' },
  '078': { slug: 'idf', label: 'Île-de-France' },
  '079': { slug: 'naq', label: 'Nouvelle-Aquitaine' },
  '080': { slug: 'hdf', label: 'Hauts-de-France' },
  '081': { slug: 'occ', label: 'Occitanie' },
  '082': { slug: 'occ', label: 'Occitanie' },
  '083': { slug: 'paca', label: 'Provence-Alpes-Côte d\'Azur' },
  '084': { slug: 'paca', label: 'Provence-Alpes-Côte d\'Azur' },
  '085': { slug: 'pdl', label: 'Pays de la Loire' },
  '086': { slug: 'naq', label: 'Nouvelle-Aquitaine' },
  '087': { slug: 'naq', label: 'Nouvelle-Aquitaine' },
  '088': { slug: 'ges', label: 'Grand Est' },
  '089': { slug: 'bfc', label: 'Bourgogne-Franche-Comté' },
  '090': { slug: 'bfc', label: 'Bourgogne-Franche-Comté' },
  '091': { slug: 'idf', label: 'Île-de-France' },
  '092': { slug: 'idf', label: 'Île-de-France' },
  '093': { slug: 'idf', label: 'Île-de-France' },
  '094': { slug: 'idf', label: 'Île-de-France' },
  '095': { slug: 'idf', label: 'Île-de-France' },
  '2A': { slug: 'cor', label: 'Corse' },
  '2B': { slug: 'cor', label: 'Corse' },
};

const DEPT_LABELS = {
  '001': 'Ain', '002': 'Aisne', '003': 'Allier', '004': 'Alpes-de-Haute-Provence',
  '005': 'Hautes-Alpes', '006': 'Alpes-Maritimes', '007': 'Ardèche', '008': 'Ardennes',
  '009': 'Ariège', '010': 'Aube', '011': 'Aude', '012': 'Aveyron', '013': 'Bouches-du-Rhône',
  '014': 'Calvados', '015': 'Cantal', '016': 'Charente', '017': 'Charente-Maritime',
  '018': 'Cher', '019': 'Corrèze', '021': 'Côte-d\'Or', '022': 'Côtes-d\'Armor',
  '023': 'Creuse', '024': 'Dordogne', '025': 'Doubs', '026': 'Drôme', '027': 'Eure',
  '028': 'Eure-et-Loir', '029': 'Finistère', '030': 'Gard', '031': 'Haute-Garonne',
  '032': 'Gers', '033': 'Gironde', '034': 'Hérault', '035': 'Ille-et-Vilaine',
  '036': 'Indre', '037': 'Indre-et-Loire', '038': 'Isère', '039': 'Jura',
  '040': 'Landes', '041': 'Loir-et-Cher', '042': 'Loire', '043': 'Haute-Loire',
  '044': 'Loire-Atlantique', '045': 'Loiret', '046': 'Lot', '047': 'Lot-et-Garonne',
  '048': 'Lozère', '049': 'Maine-et-Loire', '050': 'Manche', '051': 'Marne',
  '052': 'Haute-Marne', '053': 'Mayenne', '054': 'Meurthe-et-Moselle', '055': 'Meuse',
  '056': 'Morbihan', '057': 'Moselle', '058': 'Nièvre', '059': 'Nord', '060': 'Oise',
  '061': 'Orne', '062': 'Pas-de-Calais', '063': 'Puy-de-Dôme', '064': 'Pyrénées-Atlantiques',
  '065': 'Hautes-Pyrénées', '066': 'Pyrénées-Orientales', '067': 'Bas-Rhin',
  '068': 'Haut-Rhin', '069': 'Rhône', '070': 'Haute-Saône', '071': 'Saône-et-Loire',
  '072': 'Sarthe', '073': 'Savoie', '074': 'Haute-Savoie', '075': 'Paris',
  '076': 'Seine-Maritime', '077': 'Seine-et-Marne', '078': 'Yvelines', '079': 'Deux-Sèvres',
  '080': 'Somme', '081': 'Tarn', '082': 'Tarn-et-Garonne', '083': 'Var', '084': 'Vaucluse',
  '085': 'Vendée', '086': 'Vienne', '087': 'Haute-Vienne', '088': 'Vosges',
  '089': 'Yonne', '090': 'Territoire de Belfort', '091': 'Essonne', '092': 'Hauts-de-Seine',
  '093': 'Seine-Saint-Denis', '094': 'Val-de-Marne', '095': 'Val-d\'Oise',
  '2A': 'Corse-du-Sud', '2B': 'Haute-Corse',
};

export const AURA_DEPARTMENT_CODES = [
  '001', '003', '007', '015', '026', '038', '042', '043', '063', '069', '073', '074',
];

export function orderedDepartmentCodes() {
  const codes = [];
  for (let i = 1; i <= 95; i += 1) {
    if (i === 20) continue;
    codes.push(String(i).padStart(3, '0'));
  }
  codes.push('2A', '2B');
  return codes;
}

export function buildFranceCatalog() {
  return orderedDepartmentCodes().map((code) => {
    const region = REGION_BY_DEPT[code];
    return {
      code,
      label: DEPT_LABELS[code] ?? code,
      region_slug: region?.slug ?? 'unknown',
      region_label: region?.label ?? 'France',
    };
  });
}

export function getDepartmentEntry(code) {
  const normalized = /^2[ab]$/i.test(code)
    ? code.toUpperCase()
    : String(code).padStart(3, '0');
  return buildFranceCatalog().find((d) => d.code === normalized) ?? null;
}

export function deptCodeFromInsee(codeInsee) {
  const c = String(codeInsee ?? '').trim();
  if (c.startsWith('2A') || c.startsWith('2B')) return c.slice(0, 2).toUpperCase();
  return c.slice(0, 2).padStart(3, '0');
}

export function departmentCsvPath(code) {
  const entry = getDepartmentEntry(code);
  const fileCode = entry?.code ?? String(code).padStart(3, '0');
  return `data/departments/${fileCode}.csv`;
}
