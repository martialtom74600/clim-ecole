'use client';

import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/**
 * Curseur premium — input range natif (donc accessible clavier + ARIA),
 * habillé via la classe `.range-premium` (globals.css) :
 *   — la piste se remplit en `ink` jusqu'à la valeur,
 *   — le thumb grossit à la pression (feedback haptique visuel).
 *
 * Le remplissage est piloté par la variable CSS `--fill` (pourcentage).
 */
export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  ariaLabel?: string;
  className?: string;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={ariaLabel}
      style={{ '--fill': `${pct}%` } as CSSProperties}
      className={cn('range-premium', className)}
    />
  );
}
