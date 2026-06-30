import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { PERSONA_LIST } from '@/lib/brand';
import { PERSONA_LANDINGS } from '@/lib/gtm';

/**
 * Segmentation à l'entrée : au lieu de noyer le visiteur dans le marché, on lui
 * demande tout de suite « qu'est-ce que vous venez chercher ? » et on le route
 * vers la page métier qui parle de SON ROI (chiffrage, subventions, cumac…).
 */
export function PersonaSegmenter() {
  return (
    <section className="border-b border-line bg-surface-sunken">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-12">
        <p className="label-caps">Commencez par votre métier</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink md:text-2xl">
          Qu&apos;est-ce que vous venez chercher&nbsp;?
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PERSONA_LIST.map((p) => {
            const roiTrigger = PERSONA_LANDINGS[p.id]?.roiTrigger;
            return (
              <Link
                key={p.id}
                href={p.landingPath}
                className="group flex flex-col rounded-xl border border-line bg-white p-4 shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-raised"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                  {p.shortLabel}
                </span>
                <span className="mt-2 text-sm font-semibold leading-snug text-ink">{p.headline}</span>
                {roiTrigger && (
                  <span className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-positive-text">
                    <TrendingUp className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
                    {roiTrigger}
                  </span>
                )}
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium text-ink">
                  Voir mes territoires
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
