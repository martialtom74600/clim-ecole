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

  if (!artisans.length) {
    return (
      <div className="card mb-8 p-6 md:p-8">
        <h2 className="font-semibold text-radar-text">Artisans RGE à proximité</h2>
        <p className="mt-2 text-sm text-radar-muted">Aucun artisan référencé pour ce territoire.</p>
      </div>
    );
  }

  return (
    <div className="card mb-8 overflow-hidden">
      <div className="border-b border-radar-border px-6 py-5">
        <h2 className="font-semibold text-radar-text">Artisans RGE à proximité</h2>
        <p className="mt-1 text-sm text-radar-muted">
          {artisans.length} entreprise{artisans.length > 1 ? 's' : ''} identifiée{artisans.length > 1 ? 's' : ''} — contacts indicatifs
        </p>
      </div>
      <div className="divide-y divide-radar-border">
        {artisans.map((a) => (
          <div key={a.nom} className="grid gap-3 px-6 py-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="flex items-center gap-2 font-medium text-radar-text">
                <Wrench className="h-4 w-4 text-radar-muted" />
                {a.nom}
              </p>
              <p className="mt-1 text-xs text-radar-muted">
                {a.distanceKm != null && `${a.distanceKm.toFixed(1)} km · `}
                {a.effectif && `${a.effectif} · `}
                {a.schools.length} école{a.schools.length > 1 ? 's' : ''}
              </p>
            </div>
            {a.email ? (
              <a href={`mailto:${a.email}`} className="btn-ghost text-sm">
                <Mail className="h-4 w-4" />
                {a.email}
              </a>
            ) : (
              <span className="text-xs text-radar-subtle">Email non renseigné</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
