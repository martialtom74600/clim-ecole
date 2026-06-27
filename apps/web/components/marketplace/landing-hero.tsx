import Link from 'next/link';
import { ArrowRight, Lock, Search, Unlock } from 'lucide-react';
import { BRAND, HOW_IT_WORKS } from '@/lib/brand';
import { COPY } from '@/lib/copy';
import { getMarketplaceGlobalStats, getMarketplacePacks } from '@/lib/marketplace';
import { getCoverageBadge } from '@/lib/coverage';
import { formatInt } from '@/lib/format';
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
      <section className="border-b border-radar-border">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <p className="inline-block rounded-md bg-radar-canvas px-2.5 py-1 text-xs font-medium text-radar-muted">
            Écoles primaires · Rénovation thermique · {coverageBadge}
          </p>

          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-display-lg">
            {BRAND.promise}
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-radar-muted">
            {BRAND.tagline}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/explorer" className="btn-primary">
              {COPY.openExplorer}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/legal/methodologie" className="btn-secondary">Comment ça marche</Link>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="border-b border-radar-border bg-radar-canvas py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="text-xl font-semibold">Comment ça marche</h2>
          <p className="mt-2 max-w-2xl text-sm text-radar-muted">
            Nous regroupons les écoles par intercommunalité, estimons le budget de rénovation
            et les subventions possibles — pour que vous sachiez où prospecter avant l&apos;appel d&apos;offres.
          </p>

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, body }) => (
              <li key={step} className="card p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-radar-text text-sm font-semibold text-white">
                  {step}
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-radar-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Gratuit vs payant */}
      <section className="border-b border-radar-border py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="text-xl font-semibold">Gratuit vs débloqué</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="card p-6">
              <div className="flex items-center gap-2 text-radar-muted">
                <Search className="h-5 w-5" />
                <span className="font-semibold text-radar-text">Accès gratuit</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-radar-muted">
                <li>· Carte par département et liste des territoires</li>
                <li>· Tranche de budget et niveau de subventions (sans € exact)</li>
                <li>· Profil énergétique agrégé et note de priorité A–D</li>
                <li>· Filtres par métier (BTP, BE, AMO)</li>
              </ul>
            </div>
            <div className="card border-radar-text/20 p-6">
              <div className="flex items-center gap-2">
                <Unlock className="h-5 w-5 text-radar-text" />
                <span className="font-semibold">Dossier débloqué</span>
                <span className="text-xs text-radar-muted">· dès 290 € HT</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-radar-muted">
                <li>· Montants exacts : CAPEX, RAC, subventions, Fonds Vert</li>
                <li>· Noms des communes, écoles et contacts mairies</li>
                <li>· Détail bâtiment par bâtiment (DPE, surfaces, €)</li>
                <li>· Simulateur RAC et export PDF montage financier</li>
              </ul>
              <p className="mt-4 flex items-start gap-2 text-xs text-radar-muted">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Le gratuit suffit pour prioriser — le payant sert à chiffrer un devis et lancer la prospection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chiffres */}
      <section className="border-b border-radar-border bg-radar-canvas py-14">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="text-sm font-medium text-radar-muted">Périmètre actuel · données consolidées</h2>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatBlock
              label="Écoles recensées"
              hint="Primaires très énergivores (DPE F ou G)"
              value={formatInt(stats.totalBatiments)}
            />
            <StatBlock
              label="Territoires cartographiés"
              hint="Intercommunalités avec au moins une école"
              value={formatInt(stats.epciCount)}
            />
            <StatBlock
              label="Dossiers prioritaires"
              hint={COPY.qualifiedCriteria}
              value={formatInt(stats.qualifiedCount)}
            />
            <StatBlock
              label="Départements couverts"
              hint="Couverture en expansion continue"
              value={coverageBadge}
            />
          </dl>
        </div>
      </section>

      {/* Exemples */}
      {topDeals.length > 0 && (
        <section className="border-b border-radar-border py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <h2 className="text-xl font-semibold">Exemples de {COPY.qualified.toLowerCase()}s</h2>
            <p className="mt-2 max-w-2xl text-sm text-radar-muted">
              Aperçu anonymisé — tranches et priorité visibles. Montants exacts et contacts après achat.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {topDeals.map((deal) => (
                <Link key={deal.packId} href={`/explorer/${deal.packId}`} className="card panel-hover p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <RadarScoreBadge score={deal.radarScore} grade={deal.radarGrade} size="sm" previewOnly />
                    {deal.isHot && <span className="badge-hot">{COPY.hot}</span>}
                  </div>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-radar-subtle">
                    Territoire masqué
                  </p>
                  <p className="font-medium">{deal.publicName}</p>
                  <p className="text-sm text-radar-muted">{deal.publicZone} · {deal.department}</p>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-radar-muted">Tranche budget</dt>
                      <dd className="font-mono font-medium tabular-nums">{deal.budgetRange}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-radar-muted">{COPY.subventions}</dt>
                      <dd className="font-medium">{deal.subventionLevelLabel}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-radar-muted">Écoles concernées</dt>
                      <dd className="font-mono font-medium tabular-nums">{deal.batimentCount}</dd>
                    </div>
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
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="card bg-radar-canvas p-8 text-center md:p-12">
            <h2 className="text-2xl font-semibold">Prêt à prospecter ?</h2>
            <p className="mx-auto mt-3 max-w-lg text-radar-muted">
              Commencez par parcourir les territoires gratuitement. Aucune carte bancaire requise pour consulter les chiffres.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/explorer" className="btn-primary">
                {COPY.openExplorer}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/legal/methodologie" className="btn-ghost">
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function StatBlock({ label, hint, value }: { label: string; hint: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium">{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</dd>
      <p className="mt-1 text-xs text-radar-muted">{hint}</p>
    </div>
  );
}
