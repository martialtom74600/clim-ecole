import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { getMapMarkers } from '@/lib/data';
import { MapClient } from '@/components/cockpit/map-client';
import { Skeleton } from '@/components/ui/skeleton';

async function MapSection({ initialEpci }: { initialEpci?: string }) {
  const markers = await getMapMarkers();
  return <MapClient markers={markers} initialEpci={initialEpci} />;
}

export default async function AdminCartePage({
  searchParams,
}: {
  searchParams: Promise<{ epci?: string }>;
}) {
  const { epci } = await searchParams;

  return (
    <main className="page-content">
      <PageHeader
        title="Carte des écoles"
        description="Région Auvergne-Rhône-Alpes · cliquez un point pour la fiche"
      />
      <Suspense fallback={<Skeleton className="map-shell w-full rounded-2xl" />}>
        <MapSection initialEpci={epci} />
      </Suspense>
    </main>
  );
}
