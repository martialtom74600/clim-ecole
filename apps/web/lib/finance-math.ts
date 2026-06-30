/**
 * Primitives financières — SOURCE UNIQUE du Reste À Charge (RAC).
 *
 * Le RAC était auparavant recalculé à 3 endroits (simulateur live, export CSV,
 * note A4) avec des variantes subtiles (certaines sans le plancher à 0). Tout
 * passe désormais par ces deux fonctions pures : écran = export = note, garanti.
 */

/** Montant des subventions à partir d'un taux (0–1). */
export function subventionsFromRatio(capex: number, ratio: number): number {
  return capex * ratio;
}

/** Reste à charge après subventions — jamais négatif. */
export function resteACharge(capex: number, subventions: number): number {
  return Math.max(0, capex - subventions);
}
