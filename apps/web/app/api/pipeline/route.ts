import { NextResponse } from 'next/server';
import { patchPipelineItem } from '@/lib/pipeline';
import type { PipelineStage } from '@/lib/types';
import { requireAdminApi } from '@/lib/api-guard';

const VALID: PipelineStage[] = [
  'identifie',
  'qualifie',
  'dossier',
  'proposition',
  'signe',
];

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { readPipelineStore } = await import('@/lib/pipeline');
  const store = await readPipelineStore();
  return NextResponse.json(store);
}

export async function PATCH(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const body = (await request.json()) as {
    id?: string;
    stage?: PipelineStage;
    note?: string;
    followUpDate?: string | null;
  };

  if (!body.id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  if (body.stage && !VALID.includes(body.stage)) {
    return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
  }

  try {
    const store = await patchPipelineItem(body.id, {
      stage: body.stage,
      note: body.note,
      followUpDate: body.followUpDate,
    });
    return NextResponse.json(store);
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 400 });
  }
}
