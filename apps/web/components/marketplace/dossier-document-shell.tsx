import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { NarrativeVerdict } from '@/components/layout/narrative-page';

/**
 * Enveloppe narrative pour documents dossier (one-pager, note PDF).
 * Chrome masqué à l'impression — le verdict guide avant export.
 */
export function DossierDocumentShell({
  packId,
  label,
  headline,
  subline,
  children,
}: {
  packId: string;
  label: string;
  headline: string;
  subline: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="print:hidden">
        <NarrativeVerdict label={label} headline={headline} subline={subline}>
          <Link
            href={`/explorer/${packId}?section=action`}
            className="btn-ghost -ml-2 mt-4 inline-flex text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dossier — Action
          </Link>
          <p className="mt-3 text-xs text-ink-subtle">
            {COPY.estimatesNote}
          </p>
        </NarrativeVerdict>
      </div>
      <div className="page-content print:!max-w-none print:!p-0 print:!py-0">{children}</div>
    </div>
  );
}
