import { Mail, Wrench } from 'lucide-react';
import type { MarketplaceBuilding } from '@/lib/types';

type ArtisanRow = {
  nom: string;
  email?: string;
  distanceKm?: number;
  effectif?: string;
  schools: string[];
};

function aggregateArtisans(buildings: MarketplaceBuilding[]): ArtisanRow[] {
  const map = new Map<string, ArtisanRow>();

  for (const b of buildings) {
    if (!b.artisanNom?.trim()) continue;
    const key = b.artisanNom.trim().toLowerCase();
    const existing = map.get(key);
    const school = b.realName ?? b.publicName;

    if (existing) {
      if (!existing.schools.includes(school)) existing.schools.push(school);
      continue;
    }

    map.set(key, {
      nom: b.artisanNom.trim(),
      email: b.artisanEmail || undefined,
      distanceKm: b.artisanDistanceKm,
      effectif: b.artisanEffectifLabel || undefined,
      schools: [school],
    });
  }

  return [...map.values()].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
}

export function DossierArtisansSection({ buildings }: { buildings: MarketplaceBuilding[] }) {
  const artisans = aggregateArtisans(buildings);

  if (!artisans.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <div className="border-b border-slate-100 px-4 py-3 md:px-5">
        <p className="text-sm font-semibold text-slate-900">Artisans RGE à proximité</p>
        <p className="text-xs text-slate-500">
          {artisans.length} entreprise{artisans.length > 1 ? 's' : ''} — contacts indicatifs
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {artisans.map((a) => (
          <div
            key={a.nom}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <Wrench className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {a.nom}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {a.distanceKm != null && `${a.distanceKm.toFixed(1)} km · `}
                {a.effectif && `${a.effectif} · `}
                {a.schools.length} école{a.schools.length > 1 ? 's' : ''}
              </p>
            </div>
            {a.email ? (
              <a
                href={`mailto:${a.email}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Mail className="h-3.5 w-3.5" />
                Contacter
              </a>
            ) : (
              <span className="text-xs text-slate-400">Email non renseigné</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
