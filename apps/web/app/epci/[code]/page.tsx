import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getEpciByCode } from '@/lib/data';
import { EpciDetailView } from '@/components/cockpit/epci-detail';
import { EpciDetailSkeleton } from '@/components/cockpit/epci-detail-skeleton';

async function EpciDetailContent({ code }: { code: string }) {
  const epci = await getEpciByCode(code);
  if (!epci) notFound();
  return <EpciDetailView code={code} />;
}

export default async function EpciDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <main className="page-content">
      <Suspense fallback={<EpciDetailSkeleton />}>
        <EpciDetailContent code={code} />
      </Suspense>
    </main>
  );
}
