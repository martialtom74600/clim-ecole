import { MarketplaceExplorer } from '@/components/marketplace/marketplace-explorer';

export default async function ExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  return <MarketplaceExplorer initialPersonaFilter={filter} />;
}
