import { notFound } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth';
import { isPublicDemoPack, loadPackForViewer } from '@/lib/pack-access';
import { MarketplacePackDetailView } from '@/components/marketplace/marketplace-pack-detail';

export default async function ExplorerPackPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: packId } = await params;
  const session = await getCustomerSession();
  const data = await loadPackForViewer(packId, session?.accountId);
  if (!data) notFound();

  const isDemo = await isPublicDemoPack(packId);

  return <MarketplacePackDetailView data={data} isDemo={isDemo} />;
}
