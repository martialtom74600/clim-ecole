import Link from 'next/link';
import { getMarketplacePacks } from '@/lib/marketplace';
import { formatInt } from '@/lib/format';
import { COPY } from '@/lib/copy';
import { PersonaBadgeGroup } from '@/components/brand/personas';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';

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
    .filter(Boolean);

  return (
    <div className="page-content">
      <Link href="/explorer" className="btn-ghost mb-6 -ml-2">
        ← {COPY.backToExplorer}
      </Link>
      <h1 className="text-2xl font-semibold">Comparer des territoires</h1>
      <p className="mt-2 max-w-2xl text-radar-muted">
        Mettez jusqu&apos;à 3 territoires côte à côte pour choisir où prospecter en premier.
        Comparaison sur tranches et priorité — montants exacts après achat du dossier.
      </p>

      {packs.length === 0 ? (
        <div className="card mt-8 p-8 text-center text-radar-muted">
          <p>Aucun territoire sélectionné.</p>
          <p className="mt-2 text-sm">
            Depuis l&apos;{COPY.explorer.toLowerCase()}, cliquez sur l&apos;icône {COPY.compare.toLowerCase()} sur une ligne de territoire.
          </p>
          <Link href="/explorer" className="btn-primary mt-6 inline-flex">
            {COPY.openExplorer}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {packs.map((pack) => pack && (
            <div key={pack.packId} className="card p-6">
              <RadarScoreBadge score={pack.radarScore} grade={pack.radarGrade} previewOnly />
              <PersonaBadgeGroup personas={pack.personas} className="mt-3" />
              <p className="font-semibold">{pack.publicName}</p>
              <p className="text-xs text-radar-muted">{pack.department} · identité masquée</p>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-radar-muted">Tranche budget</dt>
                  <dd className="font-bold tabular-nums">{pack.budgetRange}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-radar-muted">{COPY.subventions}</dt>
                  <dd className="font-semibold">{pack.subventionLevelLabel}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-radar-muted">{COPY.ecoles}</dt>
                  <dd>{formatInt(pack.batimentCount)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-radar-muted">Priorité</dt>
                  <dd>{pack.radarGrade}</dd>
                </div>
              </dl>
              <Link href={`/explorer/${pack.packId}`} className="btn-primary mt-6 w-full text-center text-sm">
                {COPY.viewDossier}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
