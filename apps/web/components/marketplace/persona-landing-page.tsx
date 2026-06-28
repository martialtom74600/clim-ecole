import Link from 'next/link';
import { ArrowRight, CheckCircle2, Layers } from 'lucide-react';
import type { PersonaLandingContent } from '@/lib/gtm';
import { PERSONAS, type ClientPersona } from '@/lib/brand';

export function PersonaLandingPage({ content }: { content: PersonaLandingContent }) {
  const isFinance = content.id === 'finance';
  const persona = !isFinance ? PERSONAS[content.id as ClientPersona] : null;

  return (
    <div className="page-content">
      <p className="label-caps">{persona?.shortLabel ?? 'Finance'} · Clim École</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">{content.heroTitle}</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-muted">{content.heroSubtitle}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {isFinance ? (
          <Link href="/portefeuille" className="btn-primary">
            Ouvrir le portefeuille national
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link href={content.ctaHref} className="btn-primary">
            {content.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <Link href="/tarifs" className="btn-secondary">
          {content.pricingHint}
        </Link>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {content.metrics.map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <p className="font-mono text-2xl font-bold tabular-nums text-ink">{value}</p>
            <p className="mt-1 text-xs text-ink-muted">{label}</p>
          </div>
        ))}
      </div>

      {isFinance && (
        <Link
          href="/portefeuille"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface-sunken p-5 transition-colors hover:border-line-strong"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
            <Layers className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">Workbench de bundling SPV</p>
            <p className="text-sm text-ink-muted">
              Sélectionnez des départements, lisez le CAPEX et le reste à charge agrégés en temps réel.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted" />
        </Link>
      )}

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold">Job-to-be-done</h2>
        <p className="text-ink-muted">{content.jobToBeDone}</p>
        <h2 className="text-xl font-semibold">Cas d&apos;usage</h2>
        <p className="text-ink-muted">{content.useCase}</p>
        <p className="rounded-lg border border-positive-border bg-positive-soft px-4 py-3 text-sm text-positive-text">
          <strong>ROI :</strong> {content.roiTrigger}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Playbook en 4 étapes</h2>
        <ol className="mt-6 space-y-4">
          {content.playbookSteps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-ink">{step.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 card p-6">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <CheckCircle2 className="h-5 w-5 text-positive" />
          Essai gratuit sur l&apos;explorateur
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Carte, scores, tranches budget — sans carte bancaire. Débloquez un territoire à 290 € HT.
        </p>
        <Link href="/explorer" className="btn-secondary mt-4 inline-flex">
          {content.ctaLabel}
        </Link>
      </section>
    </div>
  );
}
