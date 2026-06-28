import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth';
import { getAccount, updatePackPipelineStatus } from '@/lib/entitlements';
import { decodePackId, getMarketplacePackById } from '@/lib/marketplace';
import { getTerritoryTenderSignal } from '@/lib/territory-tenders';
import {
  computePipelineStats,
  isPackPipelineStatus,
  type PipelineTerritoryCard,
} from '@/lib/pipeline-crm';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const account = await getAccount(session.accountId);
  if (!account) {
    return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
  }

  const cards: PipelineTerritoryCard[] = [];

  for (const packId of account.packIds) {
    const detail = await getMarketplacePackById(packId, account.id);
    if (!detail) continue;

    const codeEpci = decodePackId(packId);
    const tender = codeEpci ? await getTerritoryTenderSignal(codeEpci) : null;

    cards.push({
      packId,
      name: detail.pack.publicName,
      department: detail.pack.department,
      capex: detail.pack.packCapexTotal,
      gainNetMairie: detail.pack.gainNetMairieTotal,
      pipelineStatus: account.pipelineByPackId?.[packId] ?? 'new',
      hasActiveTender: Boolean(tender?.hasActiveTender ?? detail.pack.hasActiveTender),
    });
  }

  return NextResponse.json({
    territories: cards,
    stats: computePipelineStats(cards),
  });
}

export async function PATCH(request: Request) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: { packId?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const { packId, status } = body;
  if (!packId || !status || !isPackPipelineStatus(status)) {
    return NextResponse.json({ error: 'packId et status requis' }, { status: 400 });
  }

  const ok = await updatePackPipelineStatus(session.accountId, packId, status);
  if (!ok) {
    return NextResponse.json({ error: 'Mise à jour refusée' }, { status: 403 });
  }

  return NextResponse.json({ ok: true, packId, status });
}
