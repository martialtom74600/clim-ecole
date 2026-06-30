import Link from 'next/link';
import { ArrowRight, Flame, Lock, Radar, Search, ShieldAlert, Unlock } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { COPY } from '@/lib/copy';
import { PRICING, priceLabel } from '@/lib/pricing';
import { getMarketplaceGlobalStats, getMarketplacePacks } from '@/lib/marketplace';
import { getCoverageBadge } from '@/lib/coverage';
import { formatInt, formatEur } from '@/lib/format';
import { PersonaSegmenter } from '@/components/brand/persona-segmenter';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';
import { Spotlight } from '@/components/ui/spotlight';
import {
  NarrativeAction,
  NarrativeKpiGrid,
  NarrativeSection,
  SiteJourneySteps,
} from '@/components/layout/narrative-page';

export async function LandingHero() {
  const [stats, packs, coverageBadge] = await Promise.all([
    getMarketplaceGlobalStats(),
    getMarketplacePacks(),
    getCoverageBadge(),
  ]);

  const topDeals = packs.filter((p) => p.isQualified).slice(0, 3);

  const verdictHeadline = `${formatInt(stats.qualifiedCount)} dossiers prioritaires sur ${formatInt(stats.epciCount)} territoires — ${formatEur(stats.totalPackCapex, true)} de travaux recensés.`;

  return (
    <>
      {/* Hero + verdict macro */}
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
            Écoles primaires · Rénovation thermique · {coverageBadge}
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-ink md:text-display-xl">
            {BRAND.promiseLead}{' '}
            <span className="bg-gradient-to-r from-heat to-heat-text bg-clip-text text-transparent">
              {BRAND.promiseAccent}
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">{verdictHeadline}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/explorer" className="btn-primary">
              {COPY.openExplorer}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/demo" className="btn-secondary">
              <Unlock className="h-4 w-4" />
              Voir un dossier complet
            </Link>
          </div>

          <NarrativeKpiGrid
            className="mt-10 max-w-3xl shadow-raised"
            items={[
              { label: 'Écoles passoires F/G', value: formatInt(stats.totalBatiments) },
              { label: 'Territoires cartographiés', value: formatInt(stats.epciCount) },
              { label: 'CAPEX identifié', value: formatEur(stats.totalPackCapex, true) },
              { label: 'Dossiers prioritaires', value: formatInt(stats.qualifiedCount), accent: true },
            ]}
          />
        </div>
      </section>

      <PersonaSegmenter />

      <NarrativeSection
        id="parcours"
        title="Le parcours en 3 étapes"
        description="De la carte au premier appel mairie — sans carte bancaire pour prioriser."
      >
        <SiteJourneySteps />
        <p className="mt-6 text-sm text-ink-muted">
          <Link href="/legal/methodologie" className="font-medium text-ink underline-offset-2 hover:underline">
            Sources, méthodologie et limites
          </Link>
        </p>
      </NarrativeSection>

      {/* Contexte réglementaire — replié par défaut (progressive disclosure) */}
      <section className="border-b border-line bg-ink text-white">
        <details className="group mx-auto max-w-7xl px-5 py-6 md:px-8">
          <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Pourquoi ce marché existe</p>
              <p className="text-xs text-white/60">Décret Tertiaire · Loi ELAN · MGPE-PD — cliquer pour les chiffres</p>
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

      <NarrativeSection
        title="Gratuit vs débloqué"
        description="Le gratuit suffit pour prioriser — le payant sert à chiffrer et lancer la prospection."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <div className="flex items-center gap-2 text-ink-muted">
              <Search className="h-5 w-5" />
              <span className="font-semibold text-ink">Accès gratuit</span>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              <FeatureLine>Carte par département et liste des territoires</FeatureLine>
              <FeatureLine>Tranche de budget et niveau de subventions (sans € exact)</FeatureLine>
              <FeatureLine>Profil énergétique agrégé et note de priorité A–D</FeatureLine>
              <FeatureLine>Filtres par métier (BTP, BE, AMO, ESCO, CEE)</FeatureLine>
            </ul>
          </div>
          <div className="card relative overflow-hidden border-ink/15 p-6 shadow-raised ring-1 ring-ink/5">
            <span className="absolute right-4 top-4 rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-semibold text-white">
              dès {priceLabel(PRICING.dossier)} HT
            </span>
            <div className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-ink" />
              <span className="font-semibold">Dossier débloqué</span>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              <FeatureLine strong>Montants exacts : CAPEX, RAC, subventions, Fonds Vert</FeatureLine>
              <FeatureLine strong>Noms des communes, écoles et contacts mairies</FeatureLine>
              <FeatureLine strong>Détail bâtiment par bâtiment (DPE, surfaces, €)</FeatureLine>
              <FeatureLine strong>Simulateur RAC, montage MGPE-PD et export PDF</FeatureLine>
            </ul>
            <p className="mt-4 flex items-start gap-2 text-xs text-ink-subtle">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Débloquez quand vous êtes prêt à appeler — pas avant.
            </p>
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

      {topDeals.length > 0 && (
        <NarrativeSection
          title={`Exemples de ${COPY.qualified.toLowerCase()}s`}
          description="Aperçu anonymisé — le verdict complet dans chaque dossier."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {topDeals.map((deal) => (
              <Spotlight key={deal.packId} href={`/explorer/${deal.packId}`} className="card panel-hover block p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <RadarScoreBadge score={deal.radarScore} grade={deal.radarGrade} size="sm" previewOnly />
                  {deal.isHot && (
                    <span className="badge-hot">
                      <Flame className="h-3 w-3" />
                      {COPY.hot}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {deal.batimentCount} écoles · {deal.budgetRange} · aides {deal.subventionLevelLabel.toLowerCase()}
                </p>
                <p className="mt-2 font-medium text-ink">{deal.publicName}</p>
                <p className="text-sm text-ink-muted">{deal.publicZone} · {deal.department}</p>
              </Spotlight>
            ))}
          </div>
          <Link href="/explorer" className="btn-primary mt-8 inline-flex">
            {COPY.openExplorer}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </NarrativeSection>
      )}

      <NarrativeAction
        title="Prêt à prospecter ?"
        description="Commencez par parcourir les territoires gratuitement. Aucune carte bancaire requise."
        dark
      >
        <Link href="/explorer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.02] active:scale-95">
          {COPY.openExplorer}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/tarifs" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:text-white">
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
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${strong ? 'bg-ink' : 'bg-ink-subtle'}`} />
      <span className={strong ? 'text-ink-soft' : undefined}>{children}</span>
    </li>
  );
}
