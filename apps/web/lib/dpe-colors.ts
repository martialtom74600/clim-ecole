/** Couleurs DPE partagées carte + cartes écoles */

export const DPE_BG: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-amber-500',
  E: 'bg-orange-500',
  F: 'bg-red-500',
  G: 'bg-rose-600',
};

/**
 * Couleur de texte lisible posée sur chaque bande DPE (contraste AA).
 * Les bandes A→F sont assez claires pour de l'encre foncée ; seule la
 * bande G (rouge profond) passe mieux en blanc.
 */
export const DPE_TEXT: Record<string, string> = {
  A: 'text-ink',
  B: 'text-ink',
  C: 'text-ink',
  D: 'text-ink',
  E: 'text-ink',
  F: 'text-ink',
  G: 'text-white',
};

export const DPE_HEX: Record<string, string> = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f59e0b',
  E: '#f97316',
  F: '#ef4444',
  G: '#e11d48',
};

export function dpeLetter(classe: string): string {
  return classe?.charAt(0)?.toUpperCase() ?? '?';
}

export function dpeBgClass(classe: string): string {
  return DPE_BG[dpeLetter(classe)] ?? 'bg-ink-subtle';
}

export function dpeTextClass(classe: string): string {
  return DPE_TEXT[dpeLetter(classe)] ?? 'text-white';
}

export function dpeHex(classe: string): string {
  return DPE_HEX[dpeLetter(classe)] ?? '#64748b';
}
