'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronDown, Info } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { ALGORITHM_DISCLAIMER, DATA_SOURCES_LINE } from '@/lib/legal';
import { formatDateFr } from '@/lib/format';
import { cn } from '@/lib/utils';

export function DossierTrustFooter({
  dataLoadedAt,
  nomEpci,
  communesLabel,
}: {
  dataLoadedAt?: string;
  nomEpci?: string;
  communesLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const syncLabel = dataLoadedAt ? formatDateFr(dataLoadedAt) : '—';

  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between py-4 text-left text-xs text-slate-500"
        >
          <span className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5" />
            {COPY.dataFreshness} {syncLabel}
            {nomEpci && <> · {nomEpci}</>}
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="space-y-3 border-t border-slate-200/60 pb-6 pt-4 text-xs leading-relaxed text-slate-500">
            {communesLabel && <p>{communesLabel}</p>}
            <p>{DATA_SOURCES_LINE}</p>
            <p className="flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              {ALGORITHM_DISCLAIMER}
            </p>
            <Link href="/legal/methodologie" className="inline-flex text-slate-700 underline hover:text-slate-900">
              {COPY.methodologyLink}
            </Link>
          </div>
        )}
      </div>
    </footer>
  );
}
