import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDemoPackId, getMarketplacePackById } from '@/lib/marketplace';
import { MarketplacePackDetailView } from '@/components/marketplace/marketplace-pack-detail';
import { PRICING, priceLabel } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Démo — un dossier territoire entièrement débloqué',
  description: `Explorez gratuitement un dossier réel : montants exacts, écoles, contacts mairies et exports. Le vôtre dès ${priceLabel(PRICING.dossier)}.`,
};

export default async function DemoPage() {
  const demoId = await getDemoPackId();
  if (!demoId) notFound();

  const data = await getMarketplacePackById(demoId, null, { demo: true });
  if (!data) notFound();

  return <MarketplacePackDetailView data={data} isDemo />;
}
