import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { getMapMarkers } from '@/lib/data';
import { getCoverageBadge } from '@/lib/coverage';
import { MapClient } from '@/components/cockpit/map-client';
import { Skeleton } from '@/components/ui/skeleton';

async function MapSection({ markers }: { markers: Awaited<ReturnType<typeof getMapMarkers>> }) {
  return <MapClient markers={markers} />;
}

export default async function CartePage() {
  const [markers, coverageBadge] = await Promise.all([getMapMarkers(), getCoverageBadge()]);

  return (
    <main className="page-content">
      <PageHeader
        title="Carte des écoles"
        description={`${markers.length} bâtiments · ${coverageBadge}`}
        count={markers.length}
      />
      <Suspense fallback={<Skeleton className="h-[calc(100vh-8rem)] w-full rounded-xl" />}>
        <MapSection markers={markers} />
      </Suspense>
    </main>
  );
}
