import Link from 'next/link';
import { decodePackId } from '@/lib/pack-id';
import { formatDateFr } from '@/lib/format';
import { COPY } from '@/lib/copy';
import { DOSSIER_CONTENT } from '@/lib/dossier-ui';

/**
 * Pied de dossier — métadonnées de confiance reléguées hors de l'en-tête.
 * N° EPCI, date de MAJ, disclaimer et lien méthodologie.
 */
export function DossierFooterMeta({
  packId,
  dataLoadedAt,
}: {
  packId: string;
  dataLoadedAt?: string;
}) {
  const epciCode = decodePackId(packId);

  return (
    <footer className="border-t border-line bg-surface-sunken">
      <div className={`${DOSSIER_CONTENT} py-8`}>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-subtle">
          {epciCode && (
            <div>
              <dt className="inline font-medium text-ink-muted">N° EPCI </dt>
              <dd className="inline font-mono">{epciCode}</dd>
            </div>
          )}
          {dataLoadedAt && (
            <div>
              <dt className="inline font-medium text-ink-muted">Données MAJ </dt>
              <dd className="inline">{formatDateFr(dataLoadedAt)}</dd>
            </div>
          )}
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-ink-subtle">
          {COPY.estimatesNote}{' '}
          <Link href="/legal/methodologie" className="font-medium text-ink-muted underline-offset-2 hover:underline">
            Méthodologie & sources
          </Link>
        </p>
      </div>
    </footer>
  );
}
