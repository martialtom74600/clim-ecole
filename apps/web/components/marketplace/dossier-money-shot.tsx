'use client';

import { ArrowDownRight, Sparkles, TrendingDown } from 'lucide-react';
import type { MarketplaceMgpeSummary } from '@/lib/types';
import { formatEur, formatPct } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * The "money shot" — the first thing seen on an unlocked dossier.
 * Three dominant figures + an auto-generated pitch sentence, designed to
 * read like a single decision slide for a RDV maire / DGS.
 */
export function DossierMoneyShot({
  capex,
  subventionsTotal,
  subventionRatio,
  racTotal,
  gainNetMairieTotal,
  roiAnnees,
  batimentCount,
  territoryName,
  mgpe,
}: {
  capex: number;
  subventionsTotal: number;
  subventionRatio: number;
  racTotal: number;
  gainNetMairieTotal: number;
  roiAnnees: number;
  batimentCount: number;
  territoryName: string;
  mgpe?: MarketplaceMgpeSummary;
}) {
  const duree = mgpe?.dureeContratAns && mgpe.dureeContratAns > 0 ? mgpe.dureeContratAns : 15;
  const remboursement = roiAnnees > 0 ? roiAnnees : null;

  const pitch = buildPitch({
    capex,
    subventionRatio,
    racTotal,
    batimentCount,
    territoryName,
    duree,
    gainNetMairieTotal,
  });

  return (
    <section className="animate-slide-up overflow-hidden rounded-2xl border border-line bg-surface shadow-raised">
      <div className="flex items-center gap-2 border-b border-line bg-surface-sunken px-5 py-2.5">
        <Sparkles className="h-3.5 w-3.5 text-ink-subtle" />
        <span className="label-caps">Synthèse décisionnelle</span>
        <span className="ml-auto text-[11px] text-ink-subtle">
          {batimentCount} école{batimentCount > 1 ? 's' : ''} · {territoryName}
        </span>
      </div>

      <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Figure
          label="Budget travaux"
          value={formatEur(capex, true)}
          hint={`CAPEX estimé sur ${batimentCount} bâtiment${batimentCount > 1 ? 's' : ''}`}
        />
        <Figure
          label="Reste à charge"
          value={formatEur(racTotal, true)}
          hint={`après ~${formatPct(subventionRatio)} de subventions`}
          accent="warning"
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <Figure
          label={remboursement ? 'Remboursé en' : 'Gain net / an'}
          value={remboursement ? `${remboursement.toFixed(0)} ans` : `${formatEur(gainNetMairieTotal, true)}`}
          hint={remboursement ? 'par les économies d’énergie (MGPE-PD)' : 'économies nettes pour la mairie'}
          accent="positive"
          icon={<ArrowDownRight className="h-4 w-4" />}
        />
      </div>

      <div className="border-t border-line bg-surface-sunken px-5 py-3.5">
        <p className="text-sm leading-relaxed text-ink-soft">{pitch}</p>
      </div>
    </section>
  );
}

function Figure({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: 'positive' | 'warning';
  icon?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-5">
      <div className="flex items-center gap-1.5">
        <span className="label-caps">{label}</span>
        {icon && (
          <span
            className={cn(
              accent === 'warning' && 'text-warning',
              accent === 'positive' && 'text-positive',
              !accent && 'text-ink-subtle',
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p
        className={cn(
          'mt-1.5 font-mono text-figure-lg font-semibold tabular-nums',
          accent === 'warning' && 'text-warning-text',
          accent === 'positive' && 'text-positive-text',
          !accent && 'text-ink',
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-muted">{hint}</p>
    </div>
  );
}

function buildPitch({
  capex,
  subventionRatio,
  racTotal,
  batimentCount,
  territoryName,
  duree,
  gainNetMairieTotal,
}: {
  capex: number;
  subventionRatio: number;
  racTotal: number;
  batimentCount: number;
  territoryName: string;
  duree: number;
  gainNetMairieTotal: number;
}): string {
  const ecoles = `${batimentCount} école${batimentCount > 1 ? 's' : ''}`;
  const gainPart =
    gainNetMairieTotal > 0
      ? ` La mairie dégage ~${formatEur(gainNetMairieTotal, true)} d’économies nettes par an.`
      : '';
  return (
    `${territoryName} : ${ecoles} à rénover pour ~${formatEur(capex, true)} de travaux. ` +
    `Après ~${formatPct(subventionRatio)} de subventions publiques (Fonds Vert, DETR/DSIL), ` +
    `il reste ~${formatEur(racTotal, true)} à financer — lissables sur ${duree} ans via un MGPE-PD, ` +
    `quasi intégralement couverts par la baisse de la facture d’énergie.${gainPart}`
  );
}
