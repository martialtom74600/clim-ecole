import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { PersonaLandingContent } from '@/lib/gtm';
import { cn } from '@/lib/utils';

export function PersonaLandingRoi({ content }: { content: PersonaLandingContent }) {
  const { roiWithout, roiWith, roiTrigger } = content;

  return (
    <section className="border-b border-line bg-surface-sunken/60">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-12">
        <p className="label-caps">Retour sur investissement</p>
        <h2 className="mt-1 text-base font-semibold text-ink md:text-lg">
          Pourquoi {content.personaLabel} utilise Clim École
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{content.jobToBeDone}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Avant</p>
            <ul className="mt-4 space-y-2.5">
              {roiWithout.map((line) => (
                <RoiLine key={line} negative>
                  {line}
                </RoiLine>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-ink/15 bg-white p-5 shadow-raised ring-1 ring-ink/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink">Avec Clim École</p>
            <ul className="mt-4 space-y-2.5">
              {roiWith.map((line) => (
                <RoiLine key={line} positive>
                  {line}
                </RoiLine>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-6 rounded-xl border border-positive-border bg-positive-soft px-5 py-4 text-sm font-medium text-positive-text">
          {roiTrigger}
        </p>
      </div>
    </section>
  );
}

function RoiLine({
  children,
  negative,
  positive,
}: {
  children: React.ReactNode;
  negative?: boolean;
  positive?: boolean;
}) {
  return (
    <li className="flex items-start gap-2 text-sm text-ink-muted">
      <span
        className={cn(
          'mt-2 h-1.5 w-1.5 shrink-0 rounded-full',
          negative && 'bg-heat/70',
          positive && 'bg-positive',
        )}
      />
      <span className={positive ? 'text-ink-soft' : undefined}>{children}</span>
    </li>
  );
}

export function PersonaDossierProof({ content }: { content: PersonaLandingContent }) {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-12">
        <p className="label-caps">Le dossier débloqué</p>
        <h2 className="mt-1 text-base font-semibold text-ink md:text-lg">
          Ce que vous exploitez sur chaque territoire
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{content.useCase}</p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {content.dossierHighlights.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 text-sm text-ink-muted shadow-card"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-positive" strokeWidth={2} />
              {item}
            </li>
          ))}
        </ul>

        <Link
          href="/demo"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline-offset-4 hover:underline"
        >
          Voir un dossier complet en démo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
