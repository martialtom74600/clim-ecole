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
  const title = entry ? `${entry.term} — ${entry.plain}` : term;

  return (
    <abbr
      title={title}
      className={cn('cursor-help border-b border-dotted border-radar-subtle no-underline', className)}
    >
      {label}
    </abbr>
  );
}
