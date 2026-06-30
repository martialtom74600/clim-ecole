import { ExplorerNarrativeHeader } from '@/components/marketplace/explorer-narrative-header';
import { MarketplaceExplorer } from '@/components/marketplace/marketplace-explorer';

export default async function ExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] flex-col">
      <ExplorerNarrativeHeader />
      <div className="relative min-h-0 flex-1">
        <MarketplaceExplorer initialPersonaFilter={filter} />
      </div>
    </div>
  );
}
