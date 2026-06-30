'use client';

import Link from 'next/link';
import { useRef, type MouseEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Surface premium dont la lumière suit le curseur.
 *
 * Un halo radial discret se positionne sous le pointeur (variables CSS
 * --mx / --my mises à jour au survol), donnant l'impression que la carte
 * s'incline vers la lumière. Rendu via la classe `.spotlight` (globals.css).
 *
 * `glow="light"` pour les surfaces sombres (ex. carte tarif phare).
 */
export function Spotlight({
  href,
  glow = 'dark',
  className,
  children,
}: {
  href?: string;
  glow?: 'dark' | 'light';
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  function onMove(e: MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }

  const overlay = (
    <span aria-hidden className={cn('spotlight-glow', glow === 'light' && 'spotlight-glow-light')} />
  );
  const classes = cn('spotlight', className);

  if (href) {
    return (
      <Link href={href} ref={ref as React.Ref<HTMLAnchorElement>} onMouseMove={onMove} className={classes}>
        {overlay}
        {children}
      </Link>
    );
  }

  return (
    <div ref={ref as React.Ref<HTMLDivElement>} onMouseMove={onMove} className={classes}>
      {overlay}
      {children}
    </div>
  );
}
