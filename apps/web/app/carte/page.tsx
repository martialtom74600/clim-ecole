import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { getMapMarkers } from '@/lib/data';
import { MapClient } from '@/components/cockpit/map-client';
import { Skeleton } from '@/components/ui/skeleton';

async function MapSection() {
  const markers = await getMapMarkers();
  return <MapClient markers={markers} />;
}

export default function CartePage() {
  return (
    <main className="page-content">
      <PageHeader
        title="Carte des écoles"
        description="316 bâtiments · région Auvergne-Rhône-Alpes"
        count={316}
      />
      <Suspense fallback={<Skeleton className="h-[calc(100vh-8rem)] w-full rounded-xl" />}>
        <MapSection />
      </Suspense>
    </main>
  );
}
