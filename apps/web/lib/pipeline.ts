import fs from 'fs/promises';
import path from 'path';
import { cache } from 'react';
import type { PipelineStage, PipelineStore } from './types';

const PIPELINE_PATH = path.resolve(process.cwd(), 'data/pipeline.json');

const EMPTY_STORE: PipelineStore = { items: {} };

export async function readPipelineStore(): Promise<PipelineStore> {
  try {
    const raw = await fs.readFile(PIPELINE_PATH, 'utf-8');
    return JSON.parse(raw) as PipelineStore;
  } catch {
    return { ...EMPTY_STORE, items: { ...EMPTY_STORE.items } };
  }
}

export async function writePipelineStore(store: PipelineStore): Promise<void> {
  await fs.mkdir(path.dirname(PIPELINE_PATH), { recursive: true });
  await fs.writeFile(PIPELINE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

export interface PipelinePatch {
  stage?: PipelineStage;
  note?: string;
  followUpDate?: string | null;
}

export async function patchPipelineItem(
  id: string,
  patch: PipelinePatch,
): Promise<PipelineStore> {
  const store = await readPipelineStore();
  const existing = store.items[id];

  if (!existing && !patch.stage) {
    throw new Error('Cannot create pipeline item without stage');
  }

  store.items[id] = {
    stage: patch.stage ?? existing!.stage,
    note: patch.note !== undefined ? patch.note : existing?.note,
    followUpDate:
      patch.followUpDate !== undefined
        ? patch.followUpDate ?? undefined
        : existing?.followUpDate,
    updatedAt: new Date().toISOString(),
  };

  await writePipelineStore(store);
  return store;
}

export const getPipelineStore = cache(readPipelineStore);

export function schoolPipelineId(codeUai: string): string {
  return `school:${codeUai}`;
}

export function epciPipelineId(codeEpci: string): string {
  return `epci:${codeEpci}`;
}
