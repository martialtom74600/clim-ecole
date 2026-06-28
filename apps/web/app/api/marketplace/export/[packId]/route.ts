import { NextResponse } from 'next/server';
import { decodePackId, getMarketplacePackById } from '@/lib/marketplace';
import { buildPackCsv } from '@/lib/marketplace-export';
import { requirePackAccessApi } from '@/lib/api-guard';
import { getCustomerSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ packId: string }> },
) {
  const { packId } = await params;
  const { searchParams } = new URL(request.url);
  const full = searchParams.get('full') === '1';
  const session = await getCustomerSession();
  const denied = await requirePackAccessApi(packId);
  if (denied instanceof NextResponse) return denied;

  const data = await getMarketplacePackById(packId, session?.accountId);
  if (!data?.unlocked) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const code = decodePackId(packId);
  const csv = buildPackCsv(data.pack, data.buildings, { full });
  const filename = full
    ? `clim-ecole-${code ?? 'pack'}-complet.csv`
    : `clim-ecole-${code ?? 'pack'}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
