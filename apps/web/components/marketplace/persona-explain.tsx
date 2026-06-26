import type { PersonaExplanation } from '@/lib/persona-engine';
import { PERSONAS } from '@/lib/brand';
import { PersonaBadge } from '@/components/brand/personas';

export function PersonaExplainPanel({
  explanations,
}: {
  explanations: PersonaExplanation[];
}) {
  return (
    <div className="card p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-radar-subtle">Pourquoi ce territoire ?</p>
      <h2 className="mt-2 text-lg font-semibold">
        Pertinence par métier
      </h2>
      <p className="mt-1 text-sm text-radar-muted">
        Clim École classe chaque territoire selon votre profil (travaux, ingénierie ou financement).
      </p>
      <ul className="mt-6 space-y-4">
        {explanations.map(({ persona, reasons }) => (
          <li key={persona} className="border-t border-radar-border pt-4 first:border-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <PersonaBadge persona={persona} size="md" />
              <span className="text-sm font-medium">
                {PERSONAS[persona].label}
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {reasons.map((r) => (
                <li key={r} className="text-sm text-radar-muted">
                  · {r}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
