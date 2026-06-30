import Link from 'next/link';
import { getMarketplacePacks } from '@/lib/marketplace';
import { COPY } from '@/lib/copy';
import { PAGE_VERDICTS } from '@/lib/site-narrative';
import { TerritoryScorecardCompare } from '@/components/marketplace/territory-scorecard-compare';
import { NarrativeSection, NarrativeVerdict } from '@/components/layout/narrative-page';

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

  const { label, headline, subline } = PAGE_VERDICTS.compare;

  return (
    <div>
      <NarrativeVerdict label={label} headline={headline} subline={subline}>
        <Link href="/explorer" className="btn-ghost -ml-2 mt-4 inline-flex text-sm">
          ← {COPY.backToExplorer}
        </Link>
      </NarrativeVerdict>

      <NarrativeSection
        title="Scorecard"
        description={
          packs.length > 0
            ? `${packs.length} territoire${packs.length > 1 ? 's' : ''} comparé${packs.length > 1 ? 's' : ''}.`
            : undefined
        }
        bordered={false}
      >
        {packs.length === 0 ? (
          <div className="card p-8 text-center text-ink-muted">
            <p>Aucun territoire sélectionné.</p>
            <p className="mt-2 text-sm">
              Depuis l&apos;explorateur, ajoutez jusqu&apos;à 3 territoires au comparateur.
            </p>
            <Link href="/explorer" className="btn-primary mt-6 inline-flex">
              {COPY.openExplorer}
            </Link>
          </div>
        ) : (
          <TerritoryScorecardCompare packs={packs} />
        )}
      </NarrativeSection>
    </div>
  );
}
