import { formatEur } from '@/lib/format';
import { formatBudgetRange } from '@/lib/freemium';
import { cn } from '@/lib/utils';

export function PackBudgetLabel({
  capex,
  rangeLabel,
  unlocked = false,
  className,
  title,
}: {
  capex: number;
  rangeLabel?: string;
  unlocked?: boolean;
  className?: string;
  title?: string;
}) {
  const label = unlocked
    ? formatEur(capex, true)
    : (rangeLabel ?? (capex > 0 ? formatBudgetRange(capex) : '—'));

  return (
    <span
      className={cn('tabular-nums', className)}
      title={unlocked ? title : 'Tranche indicative — montant exact après déblocage'}
    >
      {label}
    </span>
  );
}
