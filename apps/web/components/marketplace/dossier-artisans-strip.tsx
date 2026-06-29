import { Mail, Wrench } from 'lucide-react';
import type { MarketplaceBuilding } from '@/lib/types';
import { GlossaryTerm } from '@/components/ui/glossary-term';

type ArtisanRow = {
  nom: string;
  email?: string;
  distanceKm?: number;
  schools: number;
};

function aggregateArtisans(buildings: MarketplaceBuilding[]): ArtisanRow[] {
  const map = new Map<string, ArtisanRow>();

  for (const b of buildings) {
    if (!b.artisanNom?.trim()) continue;
    const key = b.artisanNom.trim().toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.schools += 1;
      continue;
    }
    map.set(key, {
      nom: b.artisanNom.trim(),
      email: b.artisanEmail || undefined,
      distanceKm: b.artisanDistanceKm,
      schools: 1,
    });
  }

  return [...map.values()].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999)).slice(0, 3);
}

export function DossierArtisansStrip({ buildings }: { buildings: MarketplaceBuilding[] }) {
  const artisans = aggregateArtisans(buildings);
  if (!artisans.length) return null;

  return (
    <div className="shrink-0 border-t border-line bg-surface-sunken px-3 py-2">
      <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
        <Wrench className="h-3 w-3" />
        <GlossaryTerm term="RGE">Artisans certifiés</GlossaryTerm> à proximité
      </p>
      <ul className="space-y-1">
        {artisans.map((a) => (
          <li key={a.nom} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="truncate text-ink-soft">
              {a.nom}
              {a.distanceKm != null && (
                <span className="text-ink-subtle"> · {a.distanceKm.toFixed(1)} km</span>
              )}
              {a.schools > 1 && (
                <span className="text-ink-subtle"> · {a.schools} écoles</span>
              )}
            </span>
            {a.email ? (
              <a
                href={`mailto:${a.email}`}
                className="inline-flex shrink-0 items-center gap-0.5 text-ink-muted hover:text-ink"
                aria-label={`Email ${a.nom}`}
              >
                <Mail className="h-3 w-3" />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
