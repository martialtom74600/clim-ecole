import Link from 'next/link';
import { getMarketplacePacks } from '@/lib/marketplace';
import { COPY } from '@/lib/copy';
import { PageHeader } from '@/components/layout/page-header';
import { TerritoryScorecardCompare } from '@/components/marketplace/territory-scorecard-compare';

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids = '' } = await searchParams;
  const idList = ids.split(',').filter(Boolean).slice(0, 3);
  const all = await getMarketplacePacks();
  const packs = idList
    .map((id) => all.find((p) => p.packId === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="page-content">
      <PageHeader
        meta={
          <Link href="/explorer" className="btn-ghost -ml-2">
            ← {COPY.backToExplorer}
          </Link>
        }
        title="Scorecard comparatif"
        subtitle="Comparez jusqu'à 3 territoires sur 5 dimensions métier (Radar, CAPEX, subventions, urgence AO, ROI). Classement algorithmique transparent — pour choisir où prospecter en premier."
      />

      {packs.length === 0 ? (
        <div className="card mt-8 p-8 text-center text-ink-muted">
          <p>Aucun territoire sélectionné.</p>
          <p className="mt-2 text-sm">
            Depuis l&apos;explorateur, cliquez sur l&apos;icône {COPY.compare.toLowerCase()} sur une
            ligne de territoire.
          </p>
          <Link href="/explorer" className="btn-primary mt-6 inline-flex">
            {COPY.openExplorer}
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <TerritoryScorecardCompare packs={packs} />
        </div>
      )}
    </div>
  );
}
