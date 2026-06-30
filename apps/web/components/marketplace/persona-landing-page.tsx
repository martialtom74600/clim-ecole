import Link from 'next/link';
import { ArrowRight, CheckCircle2, Layers } from 'lucide-react';
import type { PersonaLandingContent } from '@/lib/gtm';
import { PRICING, priceLabel } from '@/lib/pricing';
import { PERSONAS, type ClientPersona } from '@/lib/brand';
import { Disclosure } from '@/components/ui/disclosure';
import {
  NarrativeAction,
  NarrativeKpiGrid,
  NarrativeSection,
  NarrativeVerdict,
  SiteJourneySteps,
} from '@/components/layout/narrative-page';

/**
 * Landing persona — même logique que le dossier :
 * Verdict → Parcours → Preuve (repliée) → Action.
 */
export function PersonaLandingPage({ content }: { content: PersonaLandingContent }) {
  const isFinance = content.id === 'finance';
  const persona = !isFinance ? PERSONAS[content.id as ClientPersona] : null;

  return (
    <div>
      <NarrativeVerdict
        label={`${persona?.shortLabel ?? 'Finance'} · Clim École`}
        headline={content.heroTitle}
        subline={content.heroSubtitle}
      >
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
        <NarrativeKpiGrid className="mt-8 max-w-2xl" items={content.metrics.map((m) => ({
          label: m.label,
          value: m.value,
        }))} />
      </NarrativeVerdict>

      <NarrativeSection
        title="Votre parcours en 4 étapes"
        description={content.jobToBeDone}
      >
        <ol className="space-y-4">
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
      </NarrativeSection>

      <NarrativeSection title="Le parcours Clim École" description="Identique pour tous les métiers — adapté à votre filtre.">
        <SiteJourneySteps compact />
      </NarrativeSection>

      <div className="border-b border-line">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Disclosure title="Cas d'usage & ROI" hint={content.roiTrigger}>
            <p className="text-sm leading-relaxed text-ink-muted">{content.useCase}</p>
            <p className="mt-4 rounded-lg border border-positive-border bg-positive-soft px-4 py-3 text-sm text-positive-text">
              <strong>ROI :</strong> {content.roiTrigger}
            </p>
          </Disclosure>
        </div>
      </div>

      {isFinance && (
        <NarrativeSection title="Workbench SPV" description="Agrégez des départements en portefeuille finançable.">
          <Link
            href="/portefeuille"
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface-sunken p-5 transition-colors hover:border-line-strong"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
              <Layers className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">Portefeuille national</p>
              <p className="text-sm text-ink-muted">
                CAPEX et reste à charge consolidés par département, en temps réel.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted" />
          </Link>
        </NarrativeSection>
      )}

      <NarrativeAction
        title="Essai gratuit sur l'explorateur"
        description={`Carte, scores, tranches budget — sans carte bancaire. Débloquez un territoire dès ${priceLabel(PRICING.dossier)} HT.`}
      >
        <Link href="/explorer" className="btn-primary">
          {content.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/demo" className="btn-secondary">
          <CheckCircle2 className="h-4 w-4" />
          Voir un dossier complet
        </Link>
      </NarrativeAction>
    </div>
  );
}
