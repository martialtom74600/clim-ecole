import { notFound, redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth';
import { loadPackForViewer } from '@/lib/pack-access';
import { OpportunityNote } from '@/components/marketplace/opportunity-note';
import { DossierDocumentShell } from '@/components/marketplace/dossier-document-shell';
import { PAGE_VERDICTS } from '@/lib/site-narrative';

export default async function OnePagerPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: packId } = await params;
  const session = await getCustomerSession();
  const data = await loadPackForViewer(packId, session?.accountId);
  if (!data) notFound();
  if (!data.unlocked) redirect(`/explorer/${packId}`);

  const { label, headline, subline } = PAGE_VERDICTS.onePager;

  return (
    <DossierDocumentShell
      packId={packId}
      label={label}
      headline={headline}
      subline={subline}
    >
      <OpportunityNote data={data} showPrintButton />
    </DossierDocumentShell>
  );
}
