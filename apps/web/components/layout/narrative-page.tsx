import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SITE_JOURNEY } from '@/lib/site-narrative';

/** Bloc verdict — phrase d'interprétation en tête de page. */
export function NarrativeVerdict({
  label,
  headline,
  subline,
  id,
  className,
  children,
}: {
  label?: string;
  headline: string;
  subline?: string;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('border-b border-line', className)}>
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-12">
        {label && <p className="label-caps">{label}</p>}
        <h2
          className={cn(
            'font-semibold tracking-tight text-ink',
            label ? 'mt-2 text-xl md:text-2xl' : 'text-xl md:text-2xl',
          )}
        >
          {headline}
        </h2>
        {subline && (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted">{subline}</p>
        )}
        {children}
      </div>
    </section>
  );
}

/** Section narrative numérotée — contenu principal d'une page. */
export function NarrativeSection({
  id,
  label,
  title,
  description,
  children,
  className,
  bordered = true,
}: {
  id?: string;
  label?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(bordered && 'border-b border-line', className)}
    >
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-12">
        {label && <p className="label-caps">{label}</p>}
        <h2 className={cn('text-base font-semibold text-ink', label && 'mt-1')}>{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

/** Grille de KPI héros — 2 à 4 chiffres max. */
export function NarrativeKpiGrid({
  items,
  className,
}: {
  items: { label: string; value: string; hint?: string; accent?: boolean }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        'grid gap-px overflow-hidden rounded-xl border border-line bg-line',
        items.length <= 2 ? 'grid-cols-2' : items.length === 3 ? 'sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4',
        className,
      )}
    >
      {items.map(({ label, value, hint, accent }) => (
        <div key={label} className="bg-white px-4 py-4 md:px-5 md:py-5">
          <dt className="text-[11px] font-semibold uppercase tracking-widest text-ink-subtle">
            {label}
          </dt>
          <dd
            className={cn(
              'mt-2 font-mono text-2xl font-semibold tabular-nums',
              accent ? 'text-heat-text' : 'text-ink',
            )}
          >
            {value}
          </dd>
          {hint && (
            <dd className="mt-1 text-xs leading-relaxed text-ink-muted">{hint}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}

/** Parcours site en 3 étapes — réutilisé Landing, Explorateur, Méthodologie. */
export function SiteJourneySteps({ compact = false }: { compact?: boolean }) {
  return (
    <ol className={cn('grid gap-4', compact ? 'gap-3' : 'md:grid-cols-3')}>
      {SITE_JOURNEY.map(({ step, title, body, href }) => (
        <li key={step} className={cn('card', compact ? 'p-4' : 'p-6')}>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white">
            {step}
          </span>
          <h3 className={cn('font-semibold text-ink', compact ? 'mt-3 text-sm' : 'mt-4')}>
            {title}
          </h3>
          <p className={cn('leading-relaxed text-ink-muted', compact ? 'mt-1.5 text-xs' : 'mt-2 text-sm')}>
            {body}
          </p>
          {!compact && (
            <Link
              href={href}
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline"
            >
              En savoir plus
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </li>
      ))}
    </ol>
  );
}

/** CTA final — action claire en bas de page. */
export function NarrativeAction({
  title,
  description,
  children,
  dark = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <section className={cn('py-12 md:py-16', !dark && 'border-b border-line last:border-b-0')}>
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div
          className={cn(
            'rounded-2xl p-8 text-center md:p-12',
            dark
              ? 'border border-line bg-ink text-white shadow-overlay'
              : 'border border-line bg-surface-sunken',
          )}
        >
          <h2 className={cn('text-xl font-semibold md:text-2xl', dark ? 'text-white' : 'text-ink')}>
            {title}
          </h2>
          {description && (
            <p className={cn('mx-auto mt-3 max-w-lg text-sm', dark ? 'text-white/70' : 'text-ink-muted')}>
              {description}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
        </div>
      </div>
    </section>
  );
}
