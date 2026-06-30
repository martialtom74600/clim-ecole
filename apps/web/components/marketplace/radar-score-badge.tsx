import { cn } from '@/lib/utils';
import { SCORE_GRADES } from '@/lib/copy';

const GRADE: Record<string, string> = {
  A: 'bg-positive-soft text-positive-text',
  B: 'bg-surface-muted text-ink-soft',
  C: 'bg-warning-soft text-warning-text',
  D: 'bg-surface-sunken text-ink-muted',
};

export function RadarScoreBadge({
  score,
  grade,
  size = 'md',
  className,
  previewOnly = false,
}: {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  size?: 'sm' | 'md';
  className?: string;
  /** Gratuit : note seule, sans score /100 */
  previewOnly?: boolean;
}) {
  const tooltip = previewOnly
    ? SCORE_GRADES[grade]
    : `${SCORE_GRADES[grade]} (${score}/100)`;

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
      {previewOnly ? grade : `${grade} · ${score}`}
    </span>
  );
}
