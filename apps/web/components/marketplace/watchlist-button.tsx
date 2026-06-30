'use client';

import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { COPY } from '@/lib/copy';
import { useEffect, useState } from 'react';
import { getWatchlist, toggleWatchlist } from '@/lib/radar-client-storage';
import { useAccountPreferences } from '@/hooks/use-account-preferences';

export function WatchlistButton({ packId }: { packId: string }) {
  const { prefs, toggleWatchlist: syncToggle } = useAccountPreferences();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const list = prefs.watchlist.length ? prefs.watchlist : getWatchlist();
    setActive(list.includes(packId));
  }, [packId, prefs.watchlist]);

  return (
    <motion.button
      type="button"
      title={active ? COPY.removeFromFavorites : COPY.addToFavorites}
      aria-label={active ? COPY.removeFromFavorites : COPY.addToFavorites}
      whileTap={{ scale: 0.82 }}
      onClick={(e) => {
        e.stopPropagation();
        const next = syncToggle(packId);
        toggleWatchlist(packId);
        setActive(next.includes(packId));
      }}
      className={cn(
        'rounded-lg border p-2 transition-colors',
        active
          ? 'border-warning-border bg-warning-soft text-warning-text'
          : 'border-line text-ink-subtle hover:text-ink-muted',
      )}
    >
      <motion.span
        key={active ? 'on' : 'off'}
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        className="inline-flex"
      >
        <Star className={cn('h-4 w-4', active && 'fill-current')} />
      </motion.span>
    </motion.button>
  );
}
