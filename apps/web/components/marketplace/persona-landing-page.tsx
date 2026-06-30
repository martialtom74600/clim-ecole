import Link from 'next/link';
import { ArrowRight, CheckCircle2, Layers } from 'lucide-react';
import type { PersonaLandingContent } from '@/lib/gtm';
import { PERSONA_LANDINGS } from '@/lib/gtm';
import { PRICING, priceLabel } from '@/lib/pricing';
import { HOME_PERSONA_CARDS } from '@/lib/home-content';
import {
  NarrativeAction,
  NarrativeKpiGrid,
  NarrativeSection,
  NarrativeVerdict,
} from '@/components/layout/narrative-page';
import {
  PersonaDossierProof,
  PersonaLandingRoi,
} from '@/components/marketplace/persona-landing-sections';

/**
 * Landing persona — Verdict → ROI → Playbook → Preuve dossier → Action.
 * Alignée sur la home : bénéfice acheteur d'abord, pas le marché passoires.
 */
export function PersonaLandingPage({ content }: { content: PersonaLandingContent }) {
  const isFinance = content.id === 'finance';
  const primaryHref = isFinance ? '/portefeuille' : content.ctaHref;
  const primaryLabel = isFinance ? 'Ouvrir le portefeuille national' : content.ctaLabel;

  const otherSolutions = HOME_PERSONA_CARDS.filter((c) => c.id !== content.id);

  return (
    <div>
      <NarrativeVerdict
        label={`Solution · ${content.personaLabel}`}
        headline={content.heroTitle}
        subline={content.heroSubtitle}
      >
        <p className="mt-4 max-w-2xl rounded-lg border border-line bg-surface-sunken px-4 py-3 text-sm font-medium text-ink">
          {content.jobToBeDone}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={primaryHref} className="btn-primary">
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/tarifs" className="btn-secondary">
            {content.pricingHint}
          </Link>
          {!isFinance && (
            <Link href="/demo" className="btn-ghost text-sm">
              Voir un dossier complet
            </Link>
          )}
        </div>
        <NarrativeKpiGrid
          className="mt-8 max-w-2xl"
          items={content.metrics.map((m) => ({
            label: m.label,
            value: m.value,
          }))}
        />
      </NarrativeVerdict>

      <PersonaLandingRoi content={content} />

      <NarrativeSection
        label="Votre méthode"
        title="Votre parcours en 4 étapes"
        description="De la cartographie au closing — avec les bons filtres métier."
      >
        <ol className="space-y-4">
          {content.playbookSteps.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-xl border border-line bg-white p-4 shadow-card">
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
      </NarrativeSection>

      <PersonaDossierProof content={content} />

      {isFinance && (
        <NarrativeSection
          label="Workbench"
          title="Portefeuille national"
          description="Agrégez des départements — CAPEX et RAC se recalculent en temps réel."
        >
          <Link
            href="/portefeuille"
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface-sunken p-5 transition-colors hover:border-line-strong"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
              <Layers className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">Ouvrir le workbench SPV</p>
              <p className="text-sm text-ink-muted">
                {PERSONA_LANDINGS.finance.useCase}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted" />
          </Link>
        </NarrativeSection>
      )}

      <section className="border-b border-line bg-surface-sunken/40">
        <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-12">
          <p className="label-caps">Autres métiers</p>
          <h2 className="mt-1 text-base font-semibold text-ink">Une autre solution vous correspond ?</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {otherSolutions.map((s) => (
              <Link
                key={s.id}
                href={s.href}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-ink/20 hover:text-ink"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <NarrativeAction
        title={content.finalCtaTitle}
        description={`Carte et scores gratuits. Débloquez un territoire dès ${priceLabel(PRICING.dossier)} HT quand vous êtes prêt à agir.`}
        dark
      >
        <Link href={primaryHref} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.02] active:scale-95">
          {primaryLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/demo"
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
        >
          <CheckCircle2 className="h-4 w-4" />
          Voir un dossier complet
        </Link>
      </NarrativeAction>
    </div>
  );
}
