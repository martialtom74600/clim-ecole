'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COPY } from '@/lib/copy';
import { useEffect, useState } from 'react';
import { getWatchlist, toggleWatchlist } from '@/lib/radar-client-storage';

export function WatchlistButton({ packId }: { packId: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(getWatchlist().includes(packId));
  }, [packId]);

  return (
    <button
      type="button"
      title={active ? COPY.removeFromFavorites : COPY.addToFavorites}
      aria-label={active ? COPY.removeFromFavorites : COPY.addToFavorites}
      onClick={(e) => {
        e.stopPropagation();
        setActive(toggleWatchlist(packId).includes(packId));
      }}
      className={cn(
        'rounded-lg border p-2 transition-colors',
        active
          ? 'border-amber-300 bg-amber-50 text-amber-600'
          : 'border-slate-200 text-slate-400 hover:text-slate-600',
      )}
    >
      <Star className={cn('h-4 w-4', active && 'fill-current')} />
    </button>
  );
}
