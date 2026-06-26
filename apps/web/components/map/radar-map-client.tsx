'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

const RadarMapInner = dynamic(
  () => import('@/components/map/radar-map').then((m) => m.RadarMap),
  {
    ssr: false,
    loading: () => (
      <div className="radar-map-shell flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-radar-subtle">Chargement…</p>
      </div>
    ),
  },
);

export function RadarMapClient(props: ComponentProps<typeof RadarMapInner>) {
  return <RadarMapInner {...props} />;
}
