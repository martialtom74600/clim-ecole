'use client';

import { useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { DURATION, EASE } from '@/lib/motion';

/**
 * Compteur animé — la valeur « roule » jusqu'à sa cible.
 *
 * Au montage : count-up depuis `from` (0 par défaut) → effet « calculatrice
 * vivante ». À chaque changement de `value` (ex. déplacement d'un curseur) :
 * la valeur s'anime depuis l'ancienne. `format` reçoit les valeurs
 * intermédiaires (flottantes) et les met en forme à chaque frame.
 *
 * Accessibilité : si « réduire les animations » est actif, la valeur se pose
 * instantanément, sans interpolation.
 */
export function AnimatedNumber({
  value,
  format,
  from = 0,
  duration = DURATION.slow,
  className,
}: {
  value: number;
  format: (v: number) => string;
  from?: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : from);
  const display = useTransform(mv, (v) => format(v));

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration, ease: EASE.out });
    return controls.stop;
  }, [value, duration, reduce, mv]);

  return <motion.span className={className}>{display}</motion.span>;
}
