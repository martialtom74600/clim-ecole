import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getCustomerSession } from '@/lib/auth';
import { getMarketplacePackById } from '@/lib/marketplace';
import { OpportunityNote } from '@/components/marketplace/opportunity-note';
import { COPY } from '@/lib/copy';

export default async function OpportunityNotePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: packId } = await params;
  const session = await getCustomerSession();
  const data = await getMarketplacePackById(packId, session?.accountId);
  if (!data) notFound();
  if (!data.unlocked) redirect(`/explorer/${packId}`);

  return (
    <div className="page-content print:!max-w-none print:!p-0 print:!py-0">
      <Link
        href={`/explorer/${packId}`}
        className="btn-ghost mb-8 -ml-2 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        {COPY.backToExplorer}
      </Link>
      <OpportunityNote data={data} />
    </div>
  );
}
