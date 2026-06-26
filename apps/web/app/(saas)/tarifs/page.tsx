import { PricingPage } from '@/components/marketplace/pricing-page';

export default async function TarifsPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;

  return (
    <div className="page-content">
      <PricingPage highlightPlan={plan} />
    </div>
  );
}
