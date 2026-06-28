/**
 * Estimation CEE / cumac — aligné sur src/finance/ceeEngine.js
 */

export const CEE_FICHES = [
  { code: 'BAT-TH-116', label: 'Régulation horaire / zonage', gainPct: '10–15 %' },
  { code: 'BAT-TH-104', label: 'Isolation parois opaques', gainPct: '20–35 %' },
  { code: 'BAT-TH-163', label: 'PAC eau/eau ou air/eau', gainPct: '40–60 %' },
  { code: 'BAT-TH-141', label: 'Raccordement réseau chaleur', gainPct: '25–40 %' },
  { code: 'BAT-TH-142', label: 'Destratification d\'air', gainPct: '30–50 %' },
] as const;

const CUMAC_KWH_M2 = {
  LOURDE: { pac: 52, isolation: 48, gtb: 8 },
  MOYENNE: { pac: 38, isolation: 22, gtb: 6 },
} as const;

const CEE_VALORISATION_EUR_KWH = 0.0065;
const CEE_MAX_SHARE_CAPEX = 0.12;

function scenarioKey(anneeConstruction?: number): keyof typeof CUMAC_KWH_M2 {
  if (!anneeConstruction || anneeConstruction <= 0) return 'MOYENNE';
  return anneeConstruction < 1975 ? 'LOURDE' : 'MOYENNE';
}

export interface CeeEstimate {
  ceeEuros: number;
  cumacKwh: number;
  scenario: keyof typeof CUMAC_KWH_M2;
}

export function computeCeeFromBuilding(
  surfaceM2: number,
  anneeConstruction?: number,
  capexHt?: number,
): CeeEstimate {
  const surface = Math.max(0, surfaceM2);
  const scenario = scenarioKey(anneeConstruction);
  const coeffs = CUMAC_KWH_M2[scenario];
  const cumacKwh = Math.round(surface * (coeffs.pac + coeffs.isolation + coeffs.gtb));
  let ceeEuros = Math.round(cumacKwh * CEE_VALORISATION_EUR_KWH);

  if (capexHt && capexHt > 0) {
    const cap = Math.round(capexHt * CEE_MAX_SHARE_CAPEX);
    if (ceeEuros > cap) ceeEuros = cap;
  }

  return { ceeEuros, cumacKwh, scenario };
}

export function aggregatePackCee(
  buildings: { surfaceM2: number; ceeEuros?: number; anneeConstruction?: number; capexTotal?: number }[],
): { ceeEurosTotal: number; cumacKwhTotal: number } {
  let ceeEurosTotal = 0;
  let cumacKwhTotal = 0;

  for (const b of buildings) {
    if (b.ceeEuros && b.ceeEuros > 0) {
      ceeEurosTotal += b.ceeEuros;
      cumacKwhTotal += Math.round(b.ceeEuros / CEE_VALORISATION_EUR_KWH);
    } else if (b.surfaceM2 > 0) {
      const est = computeCeeFromBuilding(b.surfaceM2, b.anneeConstruction, b.capexTotal);
      ceeEurosTotal += est.ceeEuros;
      cumacKwhTotal += est.cumacKwh;
    }
  }

  return { ceeEurosTotal, cumacKwhTotal };
}
