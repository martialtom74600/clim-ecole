import { NextResponse } from 'next/server';
import { decodePackId, getMarketplacePackById } from '@/lib/marketplace';
import { getEpciByCode } from '@/lib/data';
import { buildMgpeDossierHtml } from '@/lib/dossier';
import { requirePackAccessApi } from '@/lib/api-guard';
import { getCustomerSession } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packId: string }> },
) {
  const { packId } = await params;
  const session = await getCustomerSession();
  const denied = await requirePackAccessApi(packId);
  if (denied instanceof NextResponse) return denied;

  const data = await getMarketplacePackById(packId, session?.accountId);
  if (!data?.unlocked) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const codeEpci = decodePackId(packId);
  if (!codeEpci) {
    return NextResponse.json({ error: 'Pack invalide' }, { status: 400 });
  }

  const epci = await getEpciByCode(codeEpci);
  if (!epci) {
    return NextResponse.json({ error: 'Territoire introuvable' }, { status: 404 });
  }

  const html = buildMgpeDossierHtml(epci);
  const filename = `dossier-mgpe-${codeEpci}.html`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
