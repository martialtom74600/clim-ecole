import { getMarketplaceGlobalStats, getMarketplacePacks } from '@/lib/marketplace';
import { ExplorerSplitView } from '@/components/marketplace/explorer-split-view';

export async function MarketplaceExplorer() {
  const [packs, stats] = await Promise.all([
    getMarketplacePacks(),
    getMarketplaceGlobalStats(),
  ]);

  return (
    <ExplorerSplitView
      packs={packs}
      qualifiedCount={stats.qualifiedCount}
    />
  );
}
