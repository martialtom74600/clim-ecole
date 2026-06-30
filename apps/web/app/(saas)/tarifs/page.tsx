import { PricingPage } from '@/components/marketplace/pricing-page';
import { getCoverageBadge } from '@/lib/coverage';

export default async function TarifsPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const coverageBadge = await getCoverageBadge();

  return <PricingPage highlightPlan={plan} coverageBadge={coverageBadge} />;
}
