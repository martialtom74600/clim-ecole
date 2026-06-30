import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PERSONA_LIST } from '@/lib/brand';
import { Spotlight } from '@/components/ui/spotlight';

export function ClientPersonasSection() {
  return (
    <section className="border-b border-radar-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <h2 className="text-xl font-semibold">Pour qui ?</h2>
        <p className="mt-2 max-w-2xl text-sm text-radar-muted">
          Un même territoire peut intéresser plusieurs métiers. Clim École tague chaque dossier selon votre profil.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONA_LIST.map((p) => (
            <Spotlight
              key={p.id}
              href={p.landingPath}
              className="card panel-hover group block p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-radar-subtle">{p.shortLabel}</p>
              <h3 className="mt-2 font-semibold">{p.headline}</h3>
              <p className="mt-3 text-sm leading-relaxed text-radar-muted">{p.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-radar-text group-hover:underline">
                En savoir plus
                <ArrowRight className="h-3 w-3" />
              </span>
            </Spotlight>
          ))}
          <Spotlight
            href="/finance"
            className="card panel-hover group block border-dashed p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-radar-subtle">Finance</p>
            <h3 className="mt-2 font-semibold">SPL, STF & fonds infra</h3>
            <p className="mt-3 text-sm leading-relaxed text-radar-muted">
              Data Room nationale, bundling multi-EPCI, déploiement de capital territorial.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-radar-text group-hover:underline">
              Data Room · 5 000 €/mois
              <ArrowRight className="h-3 w-3" />
            </span>
          </Spotlight>
        </div>
      </div>
    </section>
  );
}

export { PersonaBadge, PersonaBadgeGroup } from './personas-badges';
