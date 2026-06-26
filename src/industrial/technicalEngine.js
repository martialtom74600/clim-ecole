const SCENARIOS = {
  LOURDE: {
    typeTravaux: 'Rénovation Lourde',
    description: 'Isolation Extérieure + PAC + Fenêtres',
    capexEurM2: 180,
    heuresHommesParM2: 1.5,
  },
  MOYENNE: {
    typeTravaux: 'Rénovation Moyenne',
    description: 'Isolation Combles + PAC + LED',
    capexEurM2: 120,
    heuresHommesParM2: 1.0,
  },
};

function resolveScenario(anneeConstruction) {
  const year = Number(anneeConstruction);
  if (!Number.isFinite(year) || year <= 0) {
    return SCENARIOS.MOYENNE;
  }
  if (year < 1975) {
    return SCENARIOS.LOURDE;
  }
  return SCENARIOS.MOYENNE;
}

export function computeTechnicalProfile(surfaceM2, anneeConstruction) {
  const surface = Math.max(0, Number(surfaceM2) || 0);
  const scenario = resolveScenario(anneeConstruction);

  return {
    surfaceM2: surface,
    typeTravaux: scenario.typeTravaux,
    descriptionTravaux: scenario.description,
    capexEurM2: scenario.capexEurM2,
    capexTechniqueEur: Math.round(surface * scenario.capexEurM2),
    puissancePacKw: Math.round(surface * 0.08),
    surfaceIsolantM2: Math.round(surface * 1.2),
    heuresHommesTotal: Math.round(surface * scenario.heuresHommesParM2),
    anneeConstruction: anneeConstruction ?? null,
  };
}
