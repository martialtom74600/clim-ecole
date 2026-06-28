import { cache } from 'react';
import { getSupabaseServer, isSupabaseConfigured } from './supabase-server';
import { getAllEpciSummary } from './data';

export interface TerritoryTenderSignal {
  codeEpci: string;
  hasActiveTender: boolean;
  tenderTitle?: string;
  tenderSource?: string;
  tenderUrl?: string;
  detectedAt?: string;
}

/**
 * Charge tous les signaux AO depuis Supabase (service role).
 * Prêt pour un futur cron / webhook BOAMP → upsert territory_tender_signals.
 */
async function loadTenderSignalsFromDb(): Promise<Map<string, TerritoryTenderSignal>> {
  const map = new Map<string, TerritoryTenderSignal>();
  if (!isSupabaseConfigured()) return map;

  const sb = getSupabaseServer();
  const { data, error } = await sb.from('territory_tender_signals').select('*');

  if (error) {
    console.error('[tenders] load error:', error.message);
    return map;
  }

  for (const row of data ?? []) {
    map.set(row.code_epci as string, {
      codeEpci: row.code_epci as string,
      hasActiveTender: Boolean(row.has_active_tender),
      tenderTitle: (row.tender_title as string | null) ?? undefined,
      tenderSource: (row.tender_source as string | null) ?? undefined,
      tenderUrl: (row.tender_url as string | null) ?? undefined,
      detectedAt: (row.detected_at as string | null) ?? undefined,
    });
  }

  return map;
}

/** Fallback dev sans Supabase : top 3 EPCI par CAPEX simulés AO actifs */
async function loadDevFallbackTenders(): Promise<Map<string, TerritoryTenderSignal>> {
  const map = new Map<string, TerritoryTenderSignal>();
  if (process.env.NODE_ENV === 'production') return map;

  const summaries = await getAllEpciSummary();
  const top = [...summaries].sort((a, b) => b.packCapexTotal - a.packCapexTotal).slice(0, 3);

  for (const s of top) {
    map.set(s.codeEpci, {
      codeEpci: s.codeEpci,
      hasActiveTender: true,
      tenderTitle: 'Appel d\'offres simulé (dev) — rénovation énergétique',
      tenderSource: 'DEV_SIMULATION',
    });
  }

  return map;
}

export const getTerritoryTenderSignalsMap = cache(async (): Promise<Map<string, TerritoryTenderSignal>> => {
  const fromDb = await loadTenderSignalsFromDb();
  if (fromDb.size > 0) return fromDb;
  return loadDevFallbackTenders();
});

export async function getTerritoryTenderSignal(codeEpci: string): Promise<TerritoryTenderSignal | null> {
  const map = await getTerritoryTenderSignalsMap();
  return map.get(codeEpci) ?? null;
}

export async function hasActiveTenderForEpci(codeEpci: string): Promise<boolean> {
  const signal = await getTerritoryTenderSignal(codeEpci);
  return Boolean(signal?.hasActiveTender);
}

/** Upsert pour futur connecteur BOAMP (admin / cron) */
export async function upsertTerritoryTenderSignal(input: {
  codeEpci: string;
  hasActiveTender: boolean;
  tenderTitle?: string;
  tenderSource?: string;
  tenderUrl?: string;
  detectedAt?: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const sb = getSupabaseServer();
  const { error } = await sb.from('territory_tender_signals').upsert(
    {
      code_epci: input.codeEpci,
      has_active_tender: input.hasActiveTender,
      tender_title: input.tenderTitle ?? null,
      tender_source: input.tenderSource ?? 'BOAMP',
      tender_url: input.tenderUrl ?? null,
      detected_at: input.detectedAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'code_epci' },
  );

  if (error) {
    console.error('[tenders] upsert error:', error.message);
    return false;
  }
  return true;
}
