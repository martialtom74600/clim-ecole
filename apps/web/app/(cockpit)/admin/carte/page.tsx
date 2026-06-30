import { Suspense } from 'react';
import { getMapMarkers } from '@/lib/data';
import { getCoverageScopePhrase } from '@/lib/coverage';
import { MapClient } from '@/components/cockpit/map-client';
import { CockpitVerdict } from '@/components/cockpit/cockpit-verdict';
import { Skeleton } from '@/components/ui/skeleton';
import { ADMIN_VERDICTS } from '@/lib/site-narrative';

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
  const scope = await getCoverageScopePhrase();
  const v = ADMIN_VERDICTS.carte;

  return (
    <>
      <CockpitVerdict
        label={v.label}
        headline={v.headline}
        subline={`${v.subline} Couverture : ${scope}.`}
      />
      <main className="page-content">
        <Suspense fallback={<Skeleton className="map-shell w-full rounded-2xl" />}>
          <MapSection initialEpci={epci} />
        </Suspense>
      </main>
    </>
  );
}
