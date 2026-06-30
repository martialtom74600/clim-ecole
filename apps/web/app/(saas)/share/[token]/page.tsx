import { notFound } from 'next/navigation';
import { verifyShareToken } from '@/lib/share-token';
import { getMarketplacePackById } from '@/lib/marketplace';
import { MarketplacePackDetailView } from '@/components/marketplace/marketplace-pack-detail';

export default async function ShareDossierPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = verifyShareToken(token);
  if (!payload) notFound();

  const data = await getMarketplacePackById(payload.packId, payload.accountId);
  if (!data?.unlocked) notFound();

  return (
    <div>
      <div className="border-b border-warning-border bg-warning-soft px-4 py-2 text-center text-xs text-warning-text">
        Vue partagée en lecture seule — lien valide 7 jours
      </div>
      <MarketplacePackDetailView data={data} />
    </div>
  );
}
