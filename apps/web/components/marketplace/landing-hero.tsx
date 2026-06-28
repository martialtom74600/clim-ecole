import Link from 'next/link';
import { ArrowRight, Flame, Lock, Radar, Search, ShieldAlert, Unlock } from 'lucide-react';
import { BRAND, HOW_IT_WORKS } from '@/lib/brand';
import { COPY } from '@/lib/copy';
import { getMarketplaceGlobalStats, getMarketplacePacks } from '@/lib/marketplace';
import { getCoverageBadge } from '@/lib/coverage';
import { formatInt, formatEur } from '@/lib/format';
import { ClientPersonasSection } from '@/components/brand/personas';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';

export async function LandingHero() {
  const [stats, packs, coverageBadge] = await Promise.all([
    getMarketplaceGlobalStats(),
    getMarketplacePacks(),
    getCoverageBadge(),
  ]);

  const topDeals = packs.filter((p) => p.isQualified).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(24,24,27,0.06) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
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

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">{BRAND.tagline}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/explorer" className="btn-primary">
              {COPY.openExplorer}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/legal/methodologie" className="btn-secondary">Comment ça marche</Link>
          </div>

          {/* Live proof strip */}
          <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-raised sm:grid-cols-4">
            <HeroStat label="Écoles passoires F/G" value={formatInt(stats.totalBatiments)} />
            <HeroStat label="Territoires cartographiés" value={formatInt(stats.epciCount)} />
            <HeroStat label="CAPEX identifié" value={formatEur(stats.totalPackCapex, true)} />
            <HeroStat label="Dossiers prioritaires" value={formatInt(stats.qualifiedCount)} accent />
          </dl>
        </div>
      </section>

      {/* Pression réglementaire */}
      <section className="border-b border-line bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:px-8">
          <div className="flex items-center gap-3 md:w-1/3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">La pression réglementaire crée le marché</p>
              <p className="text-xs text-white/60">Décret Tertiaire · Loi ELAN · MGPE-PD</p>
            </div>
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-4">
            <RegStat value="−40 %" label="conso. d'énergie d'ici 2030" />
            <RegStat value="40 000" label="écoles à rénover sous 10 ans" />
            <RegStat value="500 M€" label="Fonds Vert fléché écoles" />
            <RegStat value="2,5 Md€" label="prêts EduRénov mobilisables" />
          </dl>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="border-b border-line py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">Comment ça marche</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Nous regroupons les écoles par intercommunalité, estimons le budget de rénovation
            et les subventions possibles — pour que vous sachiez où prospecter avant l&apos;appel d&apos;offres.
          </p>

          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, body }) => (
              <li key={step} className="card panel-hover p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white">
                  {step}
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Gratuit vs payant */}
      <section className="border-b border-line bg-surface-sunken py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">Gratuit vs débloqué</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
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
                dès 290 € HT
              </span>
              <div className="flex items-center gap-2">
                <Unlock className="h-5 w-5 text-ink" />
                <span className="font-semibold">Dossier débloqué — la War Room</span>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
                <FeatureLine strong>Montants exacts : CAPEX, RAC, subventions, Fonds Vert</FeatureLine>
                <FeatureLine strong>Noms des communes, écoles et contacts mairies</FeatureLine>
                <FeatureLine strong>Détail bâtiment par bâtiment (DPE, surfaces, €)</FeatureLine>
                <FeatureLine strong>Simulateur RAC, montage MGPE-PD et export PDF</FeatureLine>
              </ul>
              <p className="mt-4 flex items-start gap-2 text-xs text-ink-subtle">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Le gratuit suffit pour prioriser — le payant sert à chiffrer un devis et lancer la prospection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chiffres */}
      <section className="border-b border-line py-16">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="label-caps">Périmètre actuel · données consolidées</h2>
          <dl className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatBlock label="Écoles recensées" hint="Primaires très énergivores (DPE F ou G)" value={formatInt(stats.totalBatiments)} />
            <StatBlock label="Territoires" hint="Intercommunalités cartographiées" value={formatInt(stats.epciCount)} />
            <StatBlock label="Dossiers prioritaires" hint={COPY.qualifiedCriteria} value={formatInt(stats.qualifiedCount)} />
            <StatBlock label="Départements" hint="Couverture en expansion" value={String(stats.departmentCount || coverageBadge)} />
            <StatBlock label="CAPEX pipeline" hint="Budget travaux agrégé" value={formatEur(stats.totalPackCapex, true)} />
            <StatBlock label="CEE estimés" hint="Cumac tertiaire indicatif" value={formatEur(stats.totalCeeEuros, true)} />
          </dl>
        </div>
      </section>

      {/* Exemples */}
      {topDeals.length > 0 && (
        <section className="border-b border-line py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <h2 className="text-2xl font-semibold tracking-tight">Exemples de {COPY.qualified.toLowerCase()}s</h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Aperçu anonymisé — tranches et priorité visibles. Montants exacts et contacts après achat.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {topDeals.map((deal) => (
                <Link key={deal.packId} href={`/explorer/${deal.packId}`} className="card panel-hover p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <RadarScoreBadge score={deal.radarScore} grade={deal.radarGrade} size="sm" previewOnly />
                    {deal.isHot && (
                      <span className="badge-hot">
                        <Flame className="h-3 w-3" />
                        {COPY.hot}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
                    Territoire masqué
                  </p>
                  <p className="font-medium text-ink">{deal.publicName}</p>
                  <p className="text-sm text-ink-muted">{deal.publicZone} · {deal.department}</p>
                  <dl className="mt-4 space-y-2 text-sm">
                    <DealRow label="Tranche budget" value={deal.budgetRange} mono />
                    <DealRow label={COPY.subventions} value={deal.subventionLevelLabel} />
                    <DealRow label="Écoles concernées" value={String(deal.batimentCount)} mono />
                  </dl>
                </Link>
              ))}
            </div>

            <Link href="/explorer" className="btn-primary mt-8 inline-flex">
              {COPY.openExplorer}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      <ClientPersonasSection />

      {/* CTA final */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-ink p-8 text-center text-white shadow-overlay md:p-14">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
            <h2 className="relative text-2xl font-semibold md:text-3xl">Prêt à prospecter ?</h2>
            <p className="relative mx-auto mt-3 max-w-lg text-white/70">
              Commencez par parcourir les territoires gratuitement. Aucune carte bancaire requise pour consulter les chiffres.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/explorer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.02] active:scale-95">
                {COPY.openExplorer}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/legal/methodologie" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:text-white">
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white px-4 py-4">
      <dd className={`font-mono text-2xl font-semibold tabular-nums ${accent ? 'text-heat-text' : 'text-ink'}`}>
        {value}
      </dd>
      <dt className="mt-1 text-[11px] leading-tight text-ink-muted">{label}</dt>
    </div>
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

function DealRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={mono ? 'font-mono font-medium tabular-nums text-ink' : 'font-medium text-ink'}>{value}</dd>
    </div>
  );
}

function StatBlock({ label, hint, value }: { label: string; hint: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-ink">{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-ink">{value}</dd>
      <p className="mt-1 text-xs text-ink-muted">{hint}</p>
    </div>
  );
}
