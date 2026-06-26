/** Nombre max d'achats unitaires par territoire (anti-cannibalisation) */
export function getMaxUnlocksPerPack(): number {
  const raw = process.env.PACK_MAX_UNLOCKS;
  const n = raw ? parseInt(raw, 10) : 3;
  return Number.isFinite(n) && n > 0 ? n : 3;
}
