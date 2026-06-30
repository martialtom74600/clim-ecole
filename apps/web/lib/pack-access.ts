import { cache } from 'react';
import { getDemoPackId, getMarketplacePackById } from './marketplace';
import type { MarketplacePackDetail } from './types';

export const resolvePublicDemoPackId = cache(async (): Promise<string | null> => {
  return getDemoPackId();
});

/** Territoire vitrine `/demo` — entièrement accessible sans achat. */
export async function isPublicDemoPack(packId: string): Promise<boolean> {
  const demoId = await resolvePublicDemoPackId();
  return Boolean(demoId && demoId === packId);
}

/** Charge un dossier ; débloque automatiquement le territoire démo public. */
export async function loadPackForViewer(
  packId: string,
  accountId?: string | null,
): Promise<MarketplacePackDetail | null> {
  if (await isPublicDemoPack(packId)) {
    return getMarketplacePackById(packId, null, { demo: true });
  }
  return getMarketplacePackById(packId, accountId ?? null);
}
