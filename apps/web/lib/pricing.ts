/**
 * Prix — SOURCE UNIQUE de vérité.
 *
 * Tout affichage de tarif (page Tarifs, paywall dossier, topbar, hero, démo)
 * dérive d'ici. Avant, 290 € / 990 € étaient codés en dur dans ~6 fichiers :
 * changer une grille tarifaire risquait de laisser des montants divergents.
 * Désormais : un seul endroit à modifier.
 */
export const PRICING = {
  /** Déblocage d'un territoire (one-shot, 30 jours). */
  dossier: 290,
  /** Abonnement Radar Pro mensuel. */
  pro: 990,
  /** Radar Équipe mensuel. */
  team: 1990,
  /** Origination CEE mensuel. */
  cee: 2990,
  /** Data Room National mensuel. */
  dataroom: 5000,
} as const;

/** "1990" → "1 990" (séparateur de milliers insécable, sans symbole). */
export function formatAmount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

/** "290" → "290 €" (montant + symbole, espaces insécables). */
export function priceLabel(n: number): string {
  return `${formatAmount(n)}\u00a0€`;
}
