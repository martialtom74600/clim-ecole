import 'server-only';

import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import { isSupabaseConfigured, getSupabaseServer } from './supabase-server';

type CatalogEntry = {
  code: string;
  label: string;
  region_slug: string;
  region_label: string;
};

function loadCatalog(): CatalogEntry[] {
  const candidates = [
    path.join(process.cwd(), '../../data/departments/catalog.json'),
    path.join(process.cwd(), 'data/departments/catalog.json'),
  ];
  for (const p of candidates) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8')) as CatalogEntry[];
    } catch {
      // try next
    }
  }
  return [];
}

export const getCoverageStats = cache(async () => {
  const catalog = loadCatalog();
  let regionLabels: string[] = [];
  let departmentCount = 12;
  let territoryCount = 0;
  let lastSyncAt: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServer();
      const [epciRes, jobsRes, batRes] = await Promise.all([
        supabase.from('epci').select('region'),
        supabase.from('pipeline_jobs').select('department_code, status, last_sync_at').eq('status', 'done'),
        supabase.from('batiments').select('*', { count: 'exact', head: true }),
      ]);

      const regions = [...new Set((epciRes.data ?? []).map((r) => r.region).filter(Boolean))] as string[];
      if (regions.length) regionLabels = regions.sort();
      departmentCount = jobsRes.data?.length ?? departmentCount;
      territoryCount = epciRes.data?.length ?? 0;
      const syncDates = (jobsRes.data ?? [])
        .map((j) => j.last_sync_at)
        .filter(Boolean)
        .sort();
      lastSyncAt = syncDates.at(-1) ?? null;

      if (batRes.count != null && territoryCount === 0) {
        territoryCount = epciRes.data?.length ?? 0;
      }
    } catch {
      // fallback defaults
    }
  }

  const regionLabel =
    regionLabels.length === 1
      ? regionLabels[0]
      : regionLabels.length > 1
        ? `${regionLabels.length} régions`
        : 'France';

  return {
    regionLabels,
    regionCount: regionLabels.length,
    regionLabel,
    departmentCount,
    catalogSize: catalog.length,
    territoryCount,
    lastSyncAt,
  };
});

export async function getCoverageBadge(): Promise<string> {
  const stats = await getCoverageStats();
  if (stats.regionCount > 1) {
    return `${stats.regionCount} régions · France`;
  }
  if (stats.regionCount === 1) {
    return `${stats.regionLabels[0]} · extension France`;
  }
  return `${stats.departmentCount} départements · couverture progressive`;
}

/** Phrase pour pages légales / marketing */
export async function getCoverageScopePhrase(): Promise<string> {
  const stats = await getCoverageStats();
  if (stats.regionCount > 1) {
    return 'en France (couverture progressive, département par département)';
  }
  if (stats.regionCount === 1) {
    return `en ${stats.regionLabels[0]} (extension nationale en cours)`;
  }
  return 'en France métropolitaine';
}
