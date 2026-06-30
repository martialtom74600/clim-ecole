import { NextResponse } from 'next/server';
import { getActiveCustomerAccountId } from '@/lib/api-guard';
import { getAccount, updatePackPipelineStatus } from '@/lib/entitlements';
import { decodePackId, getMarketplacePackById } from '@/lib/marketplace';
import { getTerritoryTenderSignal } from '@/lib/territory-tenders';
import { updatePackNote, loadPackNotes } from '@/lib/client-preferences-db';
import {
  computePipelineStats,
  isPackPipelineStatus,
  type PipelineTerritoryCard,
} from '@/lib/pipeline-crm';

export async function GET() {
  const accountId = await getActiveCustomerAccountId();
  if (!accountId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const account = await getAccount(accountId);
  if (!account) {
    return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
  }

  const notes = await loadPackNotes(accountId);
  const cards: PipelineTerritoryCard[] = [];

  for (const packId of account.packIds) {
    const detail = await getMarketplacePackById(packId, account.id);
    if (!detail) continue;

    const codeEpci = decodePackId(packId);
    const tender = codeEpci ? await getTerritoryTenderSignal(codeEpci) : null;
    const meta = notes[packId];

    cards.push({
      packId,
      name: detail.pack.publicName,
      department: detail.pack.department,
      capex: detail.pack.packCapexTotal,
      gainNetMairie: detail.pack.gainNetMairieTotal,
      pipelineStatus: account.pipelineByPackId?.[packId] ?? 'new',
      hasActiveTender: Boolean(tender?.hasActiveTender ?? detail.pack.hasActiveTender),
      note: meta?.note,
      nextFollowUp: meta?.nextFollowUp,
    });
  }

  return NextResponse.json({
    territories: cards,
    stats: computePipelineStats(cards),
  });
}

export async function PATCH(request: Request) {
  const accountId = await getActiveCustomerAccountId();
  if (!accountId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: { packId?: string; status?: string; note?: string | null; nextFollowUp?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const { packId, status, note, nextFollowUp } = body;
  if (!packId) {
    return NextResponse.json({ error: 'packId requis' }, { status: 400 });
  }

  if (status) {
    if (!isPackPipelineStatus(status)) {
      return NextResponse.json({ error: 'status invalide' }, { status: 400 });
    }
    const ok = await updatePackPipelineStatus(accountId, packId, status);
    if (!ok) {
      return NextResponse.json({ error: 'Mise à jour refusée' }, { status: 403 });
    }
  }

  if (note !== undefined || nextFollowUp !== undefined) {
    await updatePackNote(accountId, packId, note ?? null, nextFollowUp ?? null);
  }

  return NextResponse.json({ ok: true, packId, status, note, nextFollowUp });
}
