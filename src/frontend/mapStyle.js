/** Styles carte — lisibilité par niveau de zoom */

export const MAP_COLORS = {
  epciFinancable: 'rgba(20, 184, 166, 0.45)',
  epciMilestone: 'rgba(20, 184, 166, 0.28)',
  epciDraft: 'rgba(113, 113, 122, 0.2)',
  epciSelected: 'rgba(20, 184, 166, 0.65)',
  dept: '#3f3f46',
  schoolRingSolo: '#14b8a6',
  schoolRingPack: '#14b8a6',
  schoolRingRegrouper: '#71717a',
  schoolRingDefault: '#52525b',
};

export function getEpciVisualStage(pkg) {
  if (pkg?.ticketValid) return 'financable';
  if (pkg?.partFondsMilestone) return 'milestone';
  return 'draft';
}

export function epciStageColor(stage) {
  if (stage === 'financable') return MAP_COLORS.epciFinancable;
  if (stage === 'milestone') return MAP_COLORS.epciMilestone;
  return MAP_COLORS.epciDraft;
}

export function getMapZoomTier(zoom) {
  if (zoom <= 8.5) return 'overview';
  if (zoom <= 10.5) return 'territory';
  return 'detail';
}

export function abbreviateEpciName(name) {
  return String(name ?? '')
    .replace(/^Communauté de communes (du |de |de l'|des |d'|)/i, '')
    .replace(/^Communauté d'agglomération (du |de |de l'|des |d'|)/i, '')
    .replace(/^Métropole de /i, '')
    .replace(/^CC /i, '')
    .replace(/^CA /i, '')
    .trim();
}

export function schoolRingColor(financement) {
  if (financement === 'FINANÇABLE_SOLO') return MAP_COLORS.schoolRingSolo;
  if (financement === 'PACK_FINANÇABLE_EPCI') return MAP_COLORS.schoolRingPack;
  if (financement === 'À_REGROUPER' || financement === 'À_PACKAGER') return MAP_COLORS.schoolRingRegrouper;
  return MAP_COLORS.schoolRingDefault;
}

export function epciTerritoryStyle(pkg, tier, { selected = false, dimmed = false } = {}) {
  const stage = getEpciVisualStage(pkg);
  const financable = stage !== 'draft';
  const baseColor = epciStageColor(stage);
  const color = selected ? MAP_COLORS.epciSelected : baseColor;

  if (tier === 'overview') {
    return {
      color,
      fillColor: color,
      fillOpacity: selected ? 0.18 : dimmed ? 0.04 : 0.1,
      weight: selected ? 3.2 : 2.6,
      opacity: dimmed ? 0.45 : 0.92,
      dashArray: financable ? '10 6' : '6 5',
      smoothFactor: 2.5,
    };
  }

  if (tier === 'territory') {
    return {
      color,
      fillColor: color,
      fillOpacity: selected ? 0.16 : dimmed ? 0.03 : financable ? 0.08 : 0.05,
      weight: selected ? 2.8 : 1.8,
      opacity: dimmed ? 0.4 : 0.72,
      dashArray: financable ? null : '8 6',
      smoothFactor: 1.8,
    };
  }

  return {
    color,
    fillColor: color,
    fillOpacity: selected ? 0.18 : dimmed ? 0.02 : financable ? 0.1 : 0.06,
    weight: selected ? 3 : 2,
    opacity: dimmed ? 0.35 : 0.8,
    dashArray: financable ? null : '8 6',
    smoothFactor: 1.2,
  };
}

export function departmentBoundaryStyle(tier) {
  if (tier === 'overview') {
    return { color: '#94a3b8', weight: 2.4, opacity: 0.95, dashArray: '10 8', fillOpacity: 0 };
  }
  if (tier === 'territory') {
    return { color: MAP_COLORS.dept, weight: 2, opacity: 0.8, dashArray: '7 7', fillOpacity: 0 };
  }
  return { color: MAP_COLORS.dept, weight: 1.6, opacity: 0.65, dashArray: '5 7', fillOpacity: 0 };
}

export function schoolMarkerSize(tier, highlighted = false) {
  if (tier === 'overview') return highlighted ? 16 : 14;
  if (tier === 'territory') return highlighted ? 15 : 13;
  return highlighted ? 14 : 12;
}

/** Opacité fill EPCI proportionnelle au CAPEX (mode choroplèthe) */
export function epciCapexFillOpacity(capex, maxCapex) {
  const v = Number(capex ?? 0);
  const max = Math.max(Number(maxCapex ?? 0), 1);
  return 0.06 + (v / max) * 0.22;
}

export function getMaxPackageCapex(packages) {
  return (packages ?? []).reduce((m, p) => Math.max(m, Number(p.capexTotal ?? 0)), 0);
}
