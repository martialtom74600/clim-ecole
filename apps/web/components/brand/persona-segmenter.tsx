import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { HOME_PERSONA_CARDS, HOME_PERSONA_SECTION } from '@/lib/home-content';
import { COPY } from '@/lib/copy';

/**
 * Segmentation immédiate sous le hero — route vers la landing métier et son ROI.
 */
export function PersonaSegmenter() {
  const { label, title, description, linkLabel, fallback } = HOME_PERSONA_SECTION;

  return (
    <section id="personas" className="border-b border-line bg-surface-sunken">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-12">
        <p className="label-caps">{label}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink md:text-2xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{description}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_PERSONA_CARDS.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="group flex flex-col rounded-xl border border-line bg-white p-5 shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-raised"
            >
              <span className="text-sm font-semibold text-ink">{card.label}</span>
              <p className="mt-2 text-sm leading-snug text-ink-muted">{card.punchline}</p>
              <span className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-positive-text">
                <TrendingUp className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
                {card.roiFlash}
              </span>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium text-ink">
                {card.linkLabel ?? linkLabel}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-6 text-sm text-ink-muted">
          {fallback}{' '}
          <Link href="/explorer" className="font-medium text-ink underline-offset-2 hover:underline">
            {COPY.openExplorer}
          </Link>
        </p>
      </div>
    </section>
  );
}
