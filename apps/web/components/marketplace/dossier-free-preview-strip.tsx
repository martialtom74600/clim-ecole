import type { MarketplacePack } from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { COPY, SCORE_GRADES } from '@/lib/copy';

/**
 * Aperçu gratuit du territoire — rendu UNE SEULE FOIS, au-dessus des onglets.
 * Auparavant dupliqué à l'identique dans les onglets Finance et Prospect : le
 * prospect voyait deux fois les mêmes 4 chiffres. Centralisé ici pour ne
 * l'afficher qu'au moment le plus pertinent (entrée du dossier verrouillé).
 */
export function DossierFreePreviewStrip({
  pack,
  freePreview,
}: {
  pack: MarketplacePack;
  freePreview?: TerritoryFreePreview;
}) {
  const items = [
    { label: 'Écoles concernées', value: String(pack.batimentCount) },
    { label: 'Budget estimé', value: freePreview?.budgetRange ?? pack.budgetRange },
    {
      label: "Niveau d'aides",
      value: freePreview?.subventionLevel ?? pack.subventionLevelLabel,
    },
    {
      label: 'Profil DPE',
      value: freePreview?.dpeProfile.worstClass ?? '—',
      hint: freePreview?.dpeProfile.label,
    },
    {
      label: COPY.scorePriorite,
      value: `${pack.radarGrade} · ${pack.radarScore}/100`,
      hint: SCORE_GRADES[pack.radarGrade],
    },
  ];

  return (
    <div className="rounded-xl border border-line bg-surface-sunken p-4">
      <p className="label-caps mb-3">Aperçu gratuit de ce territoire</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map(({ label, value, hint }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[11px] text-ink-subtle">{label}</span>
            <span className="text-sm font-semibold text-ink">{value}</span>
            {hint && <span className="text-[11px] text-ink-subtle">{hint}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
