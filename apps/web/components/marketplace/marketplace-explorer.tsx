import { getMarketplaceGlobalStats, getMarketplacePacks } from '@/lib/marketplace';
import { getCoverageBadge } from '@/lib/coverage';
import { ExplorerSplitView } from '@/components/marketplace/explorer-split-view';

export async function MarketplaceExplorer() {
  const [packs, stats, coverageBadge] = await Promise.all([
    getMarketplacePacks(),
    getMarketplaceGlobalStats(),
    getCoverageBadge(),
  ]);

  return (
    <ExplorerSplitView
      packs={packs}
      qualifiedCount={stats.qualifiedCount}
      coverageBadge={coverageBadge}
    />
  );
}
