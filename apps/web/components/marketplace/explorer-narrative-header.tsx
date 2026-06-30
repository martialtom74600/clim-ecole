import { COPY, SCORE_GRADES } from '@/lib/copy';
import { PAGE_VERDICTS } from '@/lib/site-narrative';
import { SiteJourneySteps } from '@/components/layout/narrative-page';

/**
 * Barre narrative repliable au-dessus de la carte explorateur.
 * Sépare le « sens » (verdict + parcours) de l'outil (carte + filtres).
 */
export function ExplorerNarrativeHeader() {
  const { label, headline, subline } = PAGE_VERDICTS.explorer;

  return (
    <details className="group shrink-0 border-b border-line bg-white">
      <summary className="cursor-pointer list-none px-5 py-3 md:px-8 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label-caps">{label}</p>
            <p className="mt-0.5 text-sm font-medium text-ink">{headline}</p>
          </div>
          <span className="shrink-0 text-xs text-ink-muted group-open:hidden">Guide ↓</span>
          <span className="hidden shrink-0 text-xs text-ink-muted group-open:inline">Replier ↑</span>
        </div>
      </summary>
      <div className="border-t border-line bg-surface-sunken/50 px-5 pb-5 pt-4 md:px-8">
        <p className="text-sm text-ink-muted">{subline}</p>
        <div className="mt-4">
          <SiteJourneySteps compact />
        </div>
        <details className="mt-4 rounded-lg border border-line bg-white px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-ink-muted hover:text-ink">
            Score de priorité (A–D)
          </summary>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-ink-muted">
            {(Object.entries(SCORE_GRADES) as [keyof typeof SCORE_GRADES, string][]).map(
              ([grade, desc]) => (
                <li key={grade}>
                  <span className="font-mono font-semibold text-ink">{grade}</span> — {desc}
                </li>
              ),
            )}
            <li className="pt-1 text-ink-subtle">{COPY.scorePrioriteHint}</li>
          </ul>
        </details>
      </div>
    </details>
  );
}
