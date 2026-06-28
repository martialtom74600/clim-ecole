import { NextResponse } from 'next/server';
import { getMarketplacePacks } from '@/lib/marketplace';
import { searchExplorerSuggestions } from '@/lib/explorer-filters';

/** Recherche publique — territoires uniquement (pas de noms d'écoles). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const packs = await getMarketplacePacks();
  const results = searchExplorerSuggestions(packs, q, 10).map((p) => ({
    packId: p.packId,
    name: p.publicName,
    department: p.department,
    budgetRange: p.budgetRange,
    radarGrade: p.radarGrade,
    batimentCount: p.batimentCount,
    hasActiveTender: p.hasActiveTender,
  }));

  return NextResponse.json(results);
}
