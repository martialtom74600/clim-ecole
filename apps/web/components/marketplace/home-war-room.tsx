import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileText, Landmark, MapPin, Unlock } from 'lucide-react';
import { HOME_WAR_ROOM } from '@/lib/home-content';
import { COPY } from '@/lib/copy';
import { NarrativeSection } from '@/components/layout/narrative-page';

const BLOCK_ICONS = [FileText, MapPin, Landmark, CheckCircle2] as const;

export function HomeWarRoom() {
  const { label, title, description, sampleVerdict, blocks } = HOME_WAR_ROOM;

  return (
    <NarrativeSection label={label} title={title} description={description}>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface-sunken shadow-card">
          <div className="border-b border-line bg-white px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
              Exemple anonymisé
            </p>
            <p className="mt-1 font-semibold text-ink">{sampleVerdict.territory}</p>
          </div>
          <div className="space-y-4 px-5 py-5">
            <p className="text-sm leading-relaxed text-ink-muted">{sampleVerdict.verdict}</p>
            <p className="inline-flex items-center gap-2 rounded-lg border border-positive-border bg-positive-soft px-3 py-2 text-sm font-medium text-positive-text">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {sampleVerdict.decision}
            </p>
          </div>
        </div>

        <ol className="space-y-3">
          {blocks.map(({ title: blockTitle, body }, i) => {
            const Icon = BLOCK_ICONS[i] ?? FileText;
            return (
              <li
                key={blockTitle}
                className="flex gap-4 rounded-xl border border-line bg-white p-4 shadow-card"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.5} />
                    {blockTitle}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/demo" className="btn-primary">
          <Unlock className="h-4 w-4" />
          Visiter un dossier complet débloqué
        </Link>
        <Link href="/explorer" className="btn-secondary">
          {COPY.openExplorer}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </NarrativeSection>
  );
}
