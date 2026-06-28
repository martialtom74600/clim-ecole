import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getCustomerSession } from '@/lib/auth';
import { getMarketplacePackById } from '@/lib/marketplace';
import { OpportunityNote } from '@/components/marketplace/opportunity-note';
import { COPY } from '@/lib/copy';

export default async function OnePagerPage({
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
      <Link href={`/explorer/${packId}?tab=exports`} className="btn-ghost mb-4 -ml-2 print:hidden">
        <ArrowLeft className="h-4 w-4" />
        {COPY.backToExplorer}
      </Link>
      <div className="mb-6 print:hidden">
        <h1 className="text-xl font-semibold">One-pager mairie</h1>
        <p className="mt-1 text-sm text-radar-muted">
          Synthèse A4 pour vos rendez-vous élus — imprimez ou exportez en PDF depuis le navigateur.
        </p>
      </div>
      <OpportunityNote data={data} showPrintButton />
    </div>
  );
}
