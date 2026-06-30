import type { MarketplacePack } from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { COPY } from '@/lib/copy';
import { formatEur } from '@/lib/format';
import { buildTerritoryVerdict } from '@/lib/dossier-verdict';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';
import {
  DOSSIER_CONTENT,
  DOSSIER_SECTION,
  DOSSIER_SECTION_TITLE,
} from '@/lib/dossier-ui';

/**
 * Section 1 — Le verdict.
 * Une phrase qui interprète les chiffres + 3 KPI héros (budget, écoles, aides).
 * Toujours visible, même verrouillé — c'est la réponse à « est-ce que ça vaut le coup ? ».
 */
export function DossierVerdictSection({
  pack,
  freePreview,
  unlocked,
  packCapexTotal,
  subventionRatio,
  radarFactors,
}: {
  pack: MarketplacePack;
  freePreview?: TerritoryFreePreview;
  unlocked: boolean;
  packCapexTotal?: number;
  subventionRatio?: number;
  radarFactors?: string[];
}) {
  const { headline, subline } = buildTerritoryVerdict(pack, {
    freePreview,
    unlocked,
    packCapexTotal,
    subventionRatio,
  });

  const budget =
    unlocked && packCapexTotal != null
      ? formatEur(packCapexTotal, true)
      : freePreview?.budgetRange ?? pack.budgetRange;
  const aides = freePreview?.subventionLevel ?? pack.subventionLevelLabel;

  const heroes = [
    {
      label: 'Budget travaux',
      value: budget,
      hint: unlocked ? 'Montant exact consolidé' : 'Tranche indicative — exact après déblocage',
    },
    {
      label: 'Écoles F/G',
      value: String(pack.batimentCount),
      hint: freePreview?.dpeProfile.label ?? 'Passoires thermiques recensées',
    },
    {
      label: "Niveau d'aides",
      value: aides,
      hint: 'Fonds Vert, DETR, CEE — selon profil territorial',
    },
  ];

  return (
    <section id="verdict" className={DOSSIER_SECTION}>
      <div className={DOSSIER_CONTENT}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="label-caps">Le verdict</p>
            <h2 className={`${DOSSIER_SECTION_TITLE} mt-2 text-xl md:text-2xl`}>
              {headline}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted">{subline}</p>
          </div>
          <RadarScoreBadge
            score={pack.radarScore}
            grade={pack.radarGrade}
            previewOnly={!unlocked}
            size="md"
          />
        </div>

        <dl className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          {heroes.map(({ label, value, hint }) => (
            <div key={label} className="bg-white px-5 py-5 md:px-6">
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-ink-subtle">
                {label}
              </dt>
              <dd className="mt-2 text-2xl font-bold tracking-tight text-ink tabular-nums">
                {value}
              </dd>
              <dd className="mt-1.5 text-xs leading-relaxed text-ink-muted">{hint}</dd>
            </div>
          ))}
        </dl>

        {!unlocked && (
          <p className="mt-4 text-xs text-ink-subtle">{COPY.freePreviewHint}</p>
        )}

        {unlocked && radarFactors && radarFactors.length > 0 && (
          <details className="mt-6 rounded-lg border border-line bg-surface-sunken/50 px-4 py-3">
            <summary className="cursor-pointer text-xs font-medium text-ink-muted hover:text-ink">
              Pourquoi ce score {pack.radarGrade} ({pack.radarScore}/100) ?
            </summary>
            <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink-muted">
              {radarFactors.map((factor) => (
                <li key={factor} className="flex gap-2">
                  <span className="text-ink-subtle" aria-hidden>·</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </section>
  );
}
