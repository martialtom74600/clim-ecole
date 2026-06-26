import { PERSONAS } from '@/lib/brand';

export function ClientPersonasSection() {
  return (
    <section className="border-b border-radar-border py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h2 className="text-xl font-semibold">Pour qui ?</h2>
        <p className="mt-2 max-w-2xl text-sm text-radar-muted">
          Un même territoire peut intéresser plusieurs métiers. Clim École tague chaque dossier selon votre profil.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {([PERSONAS.btp, PERSONAS.be, PERSONAS.amo] as const).map((p) => (
            <article key={p.id} className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-radar-subtle">{p.shortLabel}</p>
              <h3 className="mt-2 font-semibold">{p.headline}</h3>
              <p className="mt-3 text-sm leading-relaxed text-radar-muted">{p.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// Re-export badges used elsewhere
export { PersonaBadge, PersonaBadgeGroup } from './personas-badges';
