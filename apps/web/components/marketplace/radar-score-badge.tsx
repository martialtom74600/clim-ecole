import { cn } from '@/lib/utils';
import { SCORE_GRADES } from '@/lib/copy';

const GRADE: Record<string, string> = {
  A: 'bg-green-50 text-green-700',
  B: 'bg-zinc-100 text-zinc-800',
  C: 'bg-orange-50 text-orange-700',
  D: 'bg-zinc-50 text-zinc-400',
};

export function RadarScoreBadge({
  score,
  grade,
  size = 'md',
  className,
}: {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  size?: 'sm' | 'md';
  className?: string;
}) {
  const tooltip = `${SCORE_GRADES[grade]} (${score}/100)`;

  return (
    <span
      title={tooltip}
      className={cn(
        'inline-flex cursor-help items-center gap-1 rounded font-mono font-medium tabular-nums',
        GRADE[grade],
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        className,
      )}
    >
      {grade} · {score}
    </span>
  );
}
