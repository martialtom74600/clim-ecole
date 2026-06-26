import { NextResponse } from 'next/server';
import { getEpciByCode } from '@/lib/data';
import { buildMgpeDossierHtml } from '@/lib/dossier';
import { requireAdminApi } from '@/lib/api-guard';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { code } = await params;
  const epci = await getEpciByCode(code);

  if (!epci) {
    return NextResponse.json({ error: 'EPCI not found' }, { status: 404 });
  }

  const html = buildMgpeDossierHtml(epci);
  const filename = `dossier-mgpe-${code}.html`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
