import { NextResponse } from 'next/server';
import { loadProspectionData, getAllEpciSummary } from '@/lib/data';
import type { SearchResult } from '@/lib/types';
import { requireAdminApi } from '@/lib/api-guard';

/** Cockpit interne uniquement — expose les noms réels (jamais appeler depuis le SaaS public). */
export async function GET(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase() ?? '';

  if (q.length < 2) {
    return NextResponse.json([] satisfies SearchResult[]);
  }

  const [{ rows }, epcis] = await Promise.all([
    loadProspectionData(),
    getAllEpciSummary(),
  ]);

  const results: SearchResult[] = [];

  for (const e of epcis) {
    const hay = `${e.displayName} ${e.codeEpci} ${e.communesLabel}`.toLowerCase();
    if (hay.includes(q)) {
      results.push({
        id: e.codeEpci,
        type: 'epci',
        title: e.displayName,
        subtitle: e.communesLabel || e.codeEpci,
        href: `/admin/epci/${e.codeEpci}`,
        meta: `${e.batimentCount} écoles`,
      });
    }
  }

  for (const r of rows) {
    const hay = `${r.nomEcole} ${r.commune} ${r.codeUai} ${r.codeEpci}`.toLowerCase();
    if (hay.includes(q)) {
      results.push({
        id: r.codeUai,
        type: 'school',
        title: r.nomEcole,
        subtitle: `${r.commune} · DPE ${r.classeDpe}`,
        href: `/admin/epci/${r.codeEpci}`,
        meta: r.closingTemperature,
      });
    }
    if (results.length >= 12) break;
  }

  return NextResponse.json(results.slice(0, 12));
}
