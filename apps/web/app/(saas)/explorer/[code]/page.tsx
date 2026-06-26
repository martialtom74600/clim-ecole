import { notFound } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth';
import { getMarketplacePackById } from '@/lib/marketplace';
import { MarketplacePackDetailView } from '@/components/marketplace/marketplace-pack-detail';

export default async function ExplorerPackPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: packId } = await params;
  const session = await getCustomerSession();
  const data = await getMarketplacePackById(packId, session?.accountId);
  if (!data) notFound();

  return <MarketplacePackDetailView data={data} />;
}
