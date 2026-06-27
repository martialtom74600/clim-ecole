import { Lock } from 'lucide-react';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { COPY } from '@/lib/copy';
import { SCORE_GRADES } from '@/lib/copy';
import { cn } from '@/lib/utils';

export function TerritoryFreePreviewPanel({
  preview,
  batimentCount,
  department,
  radarGrade,
  className,
}: {
  preview: TerritoryFreePreview;
  batimentCount: number;
  department: string;
  radarGrade: 'A' | 'B' | 'C' | 'D';
  className?: string;
}) {
  const items = [
    { label: COPY.budgetTravaux, value: preview.budgetRange, hint: 'Tranche — chiffre exact après achat' },
    { label: COPY.subventions, value: preview.subventionLevel, hint: 'Niveau estimé — détail € après achat' },
    { label: 'Profil énergétique', value: preview.dpeProfile.label, hint: 'Répartition DPE — détail par école après achat' },
    { label: COPY.ecoles, value: `${batimentCount} établissement${batimentCount > 1 ? 's' : ''}`, hint: undefined },
    { label: 'Priorité', value: `${radarGrade} — ${SCORE_GRADES[radarGrade]}`, hint: COPY.scorePrioriteHint },
  ];

  return (
    <div className={cn('card p-6 md:p-8', className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-radar-canvas">
          <Lock className="h-5 w-5 text-radar-muted" />
        </div>
        <div>
          <h2 className="font-semibold text-radar-text">Aperçu gratuit</h2>
          <p className="mt-1 text-sm text-radar-muted">
            {department} · {batimentCount} écoles — suffisant pour prioriser, pas pour chiffrer un devis.
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map(({ label, value, hint }) => (
          <div key={label} className="rounded-lg bg-radar-canvas px-4 py-3">
            <dt className="text-xs font-medium text-radar-muted">{label}</dt>
            <dd className="mt-1 font-semibold text-radar-text">{value}</dd>
            {hint && <dd className="mt-0.5 text-xs text-radar-subtle">{hint}</dd>}
          </div>
        ))}
      </dl>

      <p className="mt-6 text-sm text-radar-muted">
        Le déblocage ajoute les <strong className="font-medium text-radar-text">montants exacts</strong>, la{' '}
        <strong className="font-medium text-radar-text">liste école par école</strong> (DPE, surfaces, RAC),
        les <strong className="font-medium text-radar-text">contacts mairies</strong> et l&apos;export PDF.
      </p>
    </div>
  );
}
