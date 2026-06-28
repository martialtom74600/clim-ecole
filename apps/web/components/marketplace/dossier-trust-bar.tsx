import Link from 'next/link';
import { AlertTriangle, Info } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { ALGORITHM_DISCLAIMER, DATA_SOURCES_LINE } from '@/lib/legal';
import { formatDateFr } from '@/lib/format';

export function DossierTrustBar({
  dataLoadedAt,
  nomEpci,
  communesLabel,
}: {
  dataLoadedAt?: string;
  nomEpci?: string;
  communesLabel?: string;
}) {
  const syncLabel = dataLoadedAt ? formatDateFr(dataLoadedAt) : '—';

  return (
    <div className="card mb-8 border-radar-border/80 bg-radar-canvas p-4 md:p-5">
      <div className="flex flex-wrap items-start gap-3 text-xs text-radar-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-radar-signal" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p>
            <span className="font-medium text-radar-text">{COPY.dataFreshness}</span>{' '}
            {syncLabel}
            {nomEpci && (
              <>
                {' · '}
                <span className="text-radar-text">{nomEpci}</span>
              </>
            )}
            {communesLabel && <> · {communesLabel}</>}
          </p>
          <p className="leading-relaxed">{DATA_SOURCES_LINE}</p>
          <p className="flex items-start gap-1.5 leading-relaxed">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-radar-heat" aria-hidden />
            {ALGORITHM_DISCLAIMER}
          </p>
          <Link href="/legal/methodologie" className="inline-flex text-radar-signal hover:underline">
            {COPY.methodologyLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
