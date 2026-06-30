import Link from 'next/link';
import { ArrowRight, Radar, ShieldAlert, Unlock } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { PRICING, priceLabel } from '@/lib/pricing';
import { getMarketplaceGlobalStats } from '@/lib/marketplace';
import { getCoverageBadge } from '@/lib/coverage';
import { formatInt, formatEur } from '@/lib/format';
import { HOME_FINAL_CTA, HOME_HERO, HOME_OFFER } from '@/lib/home-content';
import { PersonaSegmenter } from '@/components/brand/persona-segmenter';
import { HomeWarRoom } from '@/components/marketplace/home-war-room';
import { HomeRoi } from '@/components/marketplace/home-roi';
import {
  NarrativeAction,
  NarrativeKpiGrid,
  NarrativeSection,
  SiteJourneySteps,
} from '@/components/layout/narrative-page';

export async function LandingHero() {
  const [stats, coverageBadge] = await Promise.all([
    getMarketplaceGlobalStats(),
    getCoverageBadge(),
  ]);

  return (
    <>
      {/* Hero — ROI acheteur */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(24,24,27,0.06) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-muted shadow-sm">
            <Radar className="h-3.5 w-3.5" />
            {HOME_HERO.eyebrow} · {coverageBadge}
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-ink md:text-display-xl">
            {HOME_HERO.headline}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">{HOME_HERO.subline}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/explorer" className="btn-primary">
              {HOME_HERO.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/demo" className="btn-secondary">
              <Unlock className="h-4 w-4" />
              {HOME_HERO.ctaDemo}
            </Link>
          </div>

          <p className="mt-4 max-w-xl text-sm text-ink-subtle">{HOME_HERO.microProof}</p>

          <NarrativeKpiGrid
            className="mt-10 max-w-3xl shadow-raised"
            items={[
              { label: 'CAPEX recensé', value: formatEur(stats.totalPackCapex, true) },
              { label: 'Dossiers prioritaires', value: formatInt(stats.qualifiedCount), accent: true },
              { label: 'Territoires cartographiés', value: formatInt(stats.epciCount) },
              { label: 'Contacts mairies', value: 'Inclus' },
            ]}
          />
        </div>
      </section>

      <PersonaSegmenter />

      <HomeWarRoom />

      <HomeRoi />

      <NarrativeSection
        id="parcours"
        title="De la carte au premier appel mairie — en 3 étapes"
        description="Gratuit pour prioriser. Débloquez quand vous êtes prêt à contacter."
      >
        <SiteJourneySteps />
        <p className="mt-6 text-sm text-ink-muted">
          <Link
            href="/legal/methodologie"
            className="font-medium text-ink underline-offset-2 hover:underline"
          >
            Sources, méthodologie et limites
          </Link>
        </p>
      </NarrativeSection>

      <section className="border-b border-line bg-ink text-white">
        <details className="group mx-auto max-w-7xl px-5 py-6 md:px-8">
          <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Pourquoi ce marché existe</p>
              <p className="text-xs text-white/60">
                Décret Tertiaire · Loi ELAN · MGPE-PD — cliquer pour les chiffres
              </p>
            </div>
          </summary>
          <dl className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <RegStat value="−40 %" label="conso. d'énergie d'ici 2030" />
            <RegStat value="40 000" label="écoles à rénover sous 10 ans" />
            <RegStat value="500 M€" label="Fonds Vert fléché écoles" />
            <RegStat value="2,5 Md€" label="prêts EduRénov mobilisables" />
          </dl>
        </details>
      </section>

      <NarrativeSection title={HOME_OFFER.title} description={HOME_OFFER.description}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <p className="font-semibold text-ink">{HOME_OFFER.free.title}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              {HOME_OFFER.free.items.map((item) => (
                <FeatureLine key={item}>{item}</FeatureLine>
              ))}
            </ul>
          </div>
          <div className="card relative overflow-hidden border-ink/15 p-6 shadow-raised ring-1 ring-ink/5">
            <span className="absolute right-4 top-4 rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-semibold text-white">
              dès {priceLabel(PRICING.dossier)} HT
            </span>
            <p className="font-semibold text-ink">{HOME_OFFER.paid.title}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              {HOME_OFFER.paid.items.map((item) => (
                <FeatureLine key={item} strong>
                  {item}
                </FeatureLine>
              ))}
            </ul>
          </div>
        </div>
        <Link
          href="/demo"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline-offset-4 hover:underline"
        >
          <Unlock className="h-4 w-4" />
          Visiter un dossier de démonstration entièrement débloqué
          <ArrowRight className="h-4 w-4" />
        </Link>
      </NarrativeSection>

      <NarrativeAction title={HOME_FINAL_CTA.title} description={HOME_FINAL_CTA.description} dark>
        <Link
          href="/explorer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.02] active:scale-95"
        >
          {COPY.openExplorer}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/tarifs"
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
        >
          Voir les tarifs
        </Link>
      </NarrativeAction>
    </>
  );
}

function RegStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dd className="font-mono text-xl font-semibold tabular-nums text-white">{value}</dd>
      <dt className="mt-0.5 text-[11px] leading-tight text-white/60">{label}</dt>
    </div>
  );
}

function FeatureLine({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${strong ? 'bg-ink' : 'bg-ink-subtle'}`}
      />
      <span className={strong ? 'text-ink-soft' : undefined}>{children}</span>
    </li>
  );
}
