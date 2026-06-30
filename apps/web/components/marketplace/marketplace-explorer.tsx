import { getMarketplaceGlobalStats, getMarketplacePacks } from '@/lib/marketplace';
import { getCoverageBadge } from '@/lib/coverage';
import { parseDepartmentCode } from '@/lib/geo';
import { ExplorerSplitView } from '@/components/marketplace/explorer-split-view';

export async function MarketplaceExplorer({
  initialPersonaFilter,
}: {
  initialPersonaFilter?: string;
}) {
  const [packs, stats, serverCoverageBadge] = await Promise.all([
    getMarketplacePacks(),
    getMarketplaceGlobalStats(),
    getCoverageBadge(),
  ]);

  const deptCount = new Set(
    packs.map((p) => parseDepartmentCode(p.department)).filter(Boolean),
  ).size;
  const coverageBadge =
    deptCount > 0
      ? `${deptCount} départements · ${packs.length} territoires`
      : serverCoverageBadge;

  return (
    <div className="h-full w-full">
      <ExplorerSplitView
        packs={packs}
        qualifiedCount={stats.qualifiedCount}
        coverageBadge={coverageBadge}
        initialPersonaFilter={initialPersonaFilter}
      />
    </div>
  );
}
