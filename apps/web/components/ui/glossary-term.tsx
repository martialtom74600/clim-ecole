'use client';

import { getGlossary } from '@/lib/glossary';
import { cn } from '@/lib/utils';

/** Mot technique avec infobulle au survol */
export function GlossaryTerm({
  term,
  children,
  className,
}: {
  term: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const entry = getGlossary(term);
  const label = children ?? entry?.short ?? term;

  if (!entry) {
    return <span className={className}>{label}</span>;
  }

  return (
    <span className={cn('group/term relative inline cursor-help', className)}>
      <span className="border-b border-dotted border-ink-subtle/60">{label}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 hidden w-56 -translate-x-1/2 rounded-lg border border-line bg-white px-3 py-2 text-left shadow-raised group-hover/term:block"
      >
        <span className="block text-[11px] font-semibold text-ink">{entry.term}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-muted">{entry.plain}</span>
      </span>
    </span>
  );
}
