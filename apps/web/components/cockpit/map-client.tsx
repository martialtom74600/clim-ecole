'use client';

import dynamic from 'next/dynamic';
import type { MapMarker } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const MapViewer = dynamic(() => import('@/components/cockpit/MapViewer'), {
  ssr: false,
  loading: () => <Skeleton className="map-shell w-full rounded-2xl" />,
});

export function MapClient({
  markers,
  initialEpci,
}: {
  markers: MapMarker[];
  initialEpci?: string;
}) {
  return <MapViewer markers={markers} initialEpci={initialEpci} />;
}
