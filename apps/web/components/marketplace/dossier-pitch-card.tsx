'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, MessageSquareQuote } from 'lucide-react';
import type { MarketplaceMgpeSummary } from '@/lib/types';
import { simplifyPitchForMayor } from '@/lib/narrative-copy';
import { DOSSIER_BLOCK } from '@/lib/dossier-ui';
import { useToast } from '@/components/ui/toast';

export function DossierPitchCard({
  mgpe,
  territoryName,
  batimentCount,
  racTotal,
  gainNetMairieTotal,
  dureeAns,
}: {
  mgpe: MarketplaceMgpeSummary;
  territoryName: string;
  batimentCount: number;
  racTotal: number;
  gainNetMairieTotal: number;
  dureeAns?: number;
}) {
  const duree = dureeAns ?? (mgpe.dureeContratAns > 0 ? mgpe.dureeContratAns : 15);

  const pitch = useMemo(
    () =>
      simplifyPitchForMayor(mgpe.argumentaireMgpePd, mgpe.argumentaireLoiElan, {
        territoryName,
        batimentCount,
        racTotal,
        gainNet: gainNetMairieTotal,
        duree,
      }),
    [mgpe, territoryName, batimentCount, racTotal, gainNetMairieTotal, duree],
  );

  const [copied, setCopied] = useState(false);
  const toast = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(pitch);
      setCopied(true);
      toast('Pitch copié — prêt à coller dans votre email', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Copie impossible — sélectionnez le texte manuellement', 'error');
    }
  }

  return (
    <div className={DOSSIER_BLOCK}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="h-4 w-4 text-ink-subtle" />
          <p className="text-sm font-medium text-ink">Pitch prêt-à-l&apos;emploi</p>
        </div>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink underline-offset-2 hover:underline"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-positive" />
              Copié
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copier pour mon email
            </>
          )}
        </button>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted transition-all duration-300">
        {pitch}
      </p>
    </div>
  );
}
