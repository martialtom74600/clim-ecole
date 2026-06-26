import { computeTechnicalProfile } from './technicalEngine.js';
import { computeSitePlanning } from './planningEngine.js';

export function computeIndustrialProfile(surfaceM2, anneeConstruction, referenceDate = new Date()) {
  const technical = computeTechnicalProfile(surfaceM2, anneeConstruction);
  const planning = computeSitePlanning(technical, referenceDate);

  return {
    Type_Travaux: technical.typeTravaux,
    Puissance_PAC_kW: technical.puissancePacKw,
    Ouvriers_Requis: planning.ouvriersRequis,
    Duree_Estimee_Semaines: planning.dureeEstimeeSemaines,
    Periode_Ideale_Chantier: planning.periodeIdealeChantier,
    _capexTechnique: technical.capexTechniqueEur,
    _heuresHommesTotal: technical.heuresHommesTotal,
    _surfaceIsolantM2: technical.surfaceIsolantM2,
  };
}

/** Complète les colonnes techniques CSV sans écraser les valeurs déjà présentes */
export function attachIndustrialProfile(row, referenceDate = new Date()) {
  const ref = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
    ? referenceDate
    : new Date();
  const profile = computeIndustrialProfile(row.Surface_M2, row.Annee_Construction, ref);
  return {
    ...row,
    Type_Travaux: row.Type_Travaux ?? profile.Type_Travaux,
    Puissance_PAC_kW: row.Puissance_PAC_kW ?? profile.Puissance_PAC_kW,
    Ouvriers_Requis: row.Ouvriers_Requis ?? profile.Ouvriers_Requis,
    Duree_Estimee_Semaines: row.Duree_Estimee_Semaines ?? profile.Duree_Estimee_Semaines,
    Periode_Ideale_Chantier: row.Periode_Ideale_Chantier ?? profile.Periode_Ideale_Chantier,
    _capexTechnique: row._capexTechnique ?? profile._capexTechnique,
  };
}

export { computeTechnicalProfile } from './technicalEngine.js';
export { computeSitePlanning } from './planningEngine.js';
