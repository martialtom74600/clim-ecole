'use client';

import { Printer } from 'lucide-react';
import type { MarketplacePackDetail } from '@/lib/types';
import { formatEur, formatInt, formatPct } from '@/lib/format';
import { resteACharge } from '@/lib/finance-math';
import { COPY } from '@/lib/copy';
import { ALGORITHM_DISCLAIMER } from '@/lib/legal';
import { cn } from '@/lib/utils';

const DPE_PRINT: Record<string, string> = {
  A: 'bg-positive-soft text-positive-text',
  B: 'bg-positive-soft text-positive-text',
  C: 'bg-warning-soft text-warning-text',
  D: 'bg-warning-soft text-warning-text',
  E: 'bg-heat-soft text-heat-text',
  F: 'bg-heat-soft text-heat-text',
  G: 'bg-heat-soft text-heat-text',
};

function DpePrintBadge({ classe }: { classe: string }) {
  const letter = classe?.charAt(0)?.toUpperCase() ?? '?';
  const style = DPE_PRINT[letter] ?? 'bg-surface-muted text-ink-soft';

  return (
    <span
      className={cn(
        'inline-flex min-w-[2rem] justify-center rounded px-2 py-0.5 font-mono text-sm font-bold',
        style,
      )}
    >
      {letter}
    </span>
  );
}

export function OpportunityNotePrintButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn('btn-primary print:hidden', className)}
    >
      <Printer className="h-4 w-4" />
      Imprimer le rapport en PDF
    </button>
  );
}

export function OpportunityNote({
  data,
  showPrintButton = true,
  className,
}: {
  data: MarketplacePackDetail;
  showPrintButton?: boolean;
  className?: string;
}) {
  const { pack, buildings, mgpe, resteAChargeAfterSubsTotal, nomEpci, communesLabel } = data;
  const racTotal = resteAChargeAfterSubsTotal ?? resteACharge(pack.packCapexTotal, pack.subventionsTotal);
  const date = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const subPct = Math.min(100, pack.subventionRatio * 100);
  const racPct = Math.min(100 - subPct, (racTotal / (pack.packCapexTotal || 1)) * 100);

  const mgpeText =
    mgpe?.argumentaireMgpePd ||
    `Sur la base des ${formatEur(pack.packCapexTotal)} d'investissement, le projet est éligible à un Marché Global de Performance Énergétique à Paiement Différé (Loi du 30 mars 2023). Le reste à charge après subventions est estimé à ${formatEur(racTotal)} — lissable sur ${mgpe?.dureeContratAns || '…'} ans via les économies d'énergie.`;

  const legalElan =
    mgpe?.argumentaireLoiElan ||
    "Dérogation à l'allotissement : Ce projet justifie un marché global car la séparation en lots rendrait techniquement ou financièrement impossible l'atteinte des objectifs de performance énergétique garantis.";

  return (
    <article
      className={cn(
        'mx-auto max-w-[210mm] bg-white text-ink',
        'print:max-w-none print:shadow-none print:bg-white',
        className,
      )}
    >
      {showPrintButton && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="text-sm text-ink-muted">
            Document prêt pour impression A4 — ajoutez le logo de votre cabinet avant d&apos;imprimer.
          </p>
          <OpportunityNotePrintButton />
        </div>
      )}

      {/* 1. En-tête marque blanche */}
      <header className="break-inside-avoid border-b-2 border-ink pb-6 print:pb-5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div
            className="flex h-20 w-44 shrink-0 items-center justify-center rounded border-2 border-dashed border-line-strong bg-surface-sunken text-center text-xs text-ink-muted print:h-16 print:w-40"
            aria-label="Emplacement logo du cabinet"
          >
            Logo du cabinet
          </div>
          <div className="text-right text-sm text-ink-muted print:text-xs">
            <p>{date}</p>
            <p className="mt-1">{pack.department}</p>
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-semibold leading-tight tracking-tight print:mt-5 print:text-xl">
          Note d&apos;opportunité — Rénovation énergétique du patrimoine scolaire
        </h1>
        <p className="mt-2 text-lg text-ink-soft print:text-base">{pack.publicName}</p>
        <p className="mt-1 text-sm text-ink-muted">
          {pack.batimentCount} établissement{pack.batimentCount > 1 ? 's' : ''}
          {nomEpci ? ` · ${nomEpci}` : ' · intercommunalité'}
          {communesLabel ? ` · ${communesLabel}` : ''}
        </p>
      </header>

      {/* 2. État des lieux */}
      <section className="mt-8 break-inside-avoid print:mt-6">
        <SectionTitle number={1} title="État des lieux — baseline énergétique" />
        <div className="mt-4 overflow-hidden rounded-lg border border-line print:rounded-none print:border-line-strong">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-sunken text-[11px] uppercase tracking-wide text-ink-muted print:bg-surface-muted">
                <th className="px-4 py-3 font-semibold">Bâtiment</th>
                <th className="px-4 py-3 font-semibold">Commune</th>
                <th className="px-4 py-3 font-semibold">DPE</th>
                <th className="px-4 py-3 text-right font-semibold">Surface (m²)</th>
                <th className="px-4 py-3 text-right font-semibold">CAPEX</th>
                <th className="px-4 py-3 text-right font-semibold">Gain net/an</th>
                <th className="px-4 py-3 font-semibold">Contact mairie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {buildings.map((b) => (
                <tr key={b.buildingId} className="break-inside-avoid">
                  <td className="px-4 py-3 font-medium">{b.realName ?? b.publicName}</td>
                  <td className="px-4 py-3 text-ink-muted">{b.realCommune ?? b.publicCommune}</td>
                  <td className="px-4 py-3">
                    <DpePrintBadge classe={b.classeDpe} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatInt(b.surfaceM2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatEur(b.capexTotal, true)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-positive-text">
                    {formatEur(b.gainNetMairie, true)}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {b.emailMairie ?? COPY.emailMissing}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Synthèse financière */}
      <section className="mt-10 break-inside-avoid page-break-before-auto print:mt-8">
        <SectionTitle number={2} title="Synthèse financière — le montage" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="CAPEX total estimé" value={formatEur(pack.packCapexTotal, true)} highlight />
          <KpiCard label="Potentiel subventions publiques" value={formatEur(pack.subventionsTotal, true)} />
          <KpiCard label={COPY.resteAChargeAfterSubs} value={formatEur(racTotal, true)} accent />
          <KpiCard label={COPY.gainNetMairie} value={`${formatEur(pack.gainNetMairieTotal, true)}/an`} />
        </div>
        {pack.resteAChargeTotal > 0 && (
          <p className="mt-4 text-sm text-ink-muted">
            {COPY.partFondsVert} :{' '}
            <strong className="font-semibold text-ink">
              {formatEur(pack.resteAChargeTotal, true)}
            </strong>
          </p>
        )}
        {pack.fondsVertPotential > 0 && (
          <p className="mt-4 text-sm text-ink-muted">
            Dont potentiel Fonds Vert estimé :{' '}
            <strong className="font-semibold text-ink">
              {formatEur(pack.fondsVertPotential, true)}
            </strong>
            {pack.subventionRatio > 0 && (
              <span className="text-ink-muted"> · taux global {formatPct(pack.subventionRatio)}</span>
            )}
          </p>
        )}
        <div className="mt-6 break-inside-avoid">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Répartition subventions / reste à charge
          </p>
          <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-surface-muted print:border print:border-line-strong">
            <div
              className="bg-positive"
              style={{ width: `${subPct}%` }}
              title="Subventions"
            />
            <div
              className="bg-warning"
              style={{ width: `${racPct}%` }}
              title="Reste à charge"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-muted">
            <span>Subventions {formatEur(pack.subventionsTotal, true)} ({formatPct(pack.subventionRatio)})</span>
            <span>RAC {formatEur(racTotal, true)}</span>
          </div>
        </div>
      </section>

      {/* 4. MGPE-PD */}
      <section className="mt-10 break-inside-avoid print:mt-8">
        <SectionTitle number={3} title="Modèle de tiers-financement (MGPE-PD)" />
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{mgpeText}</p>
        {mgpe && (mgpe.dureeContratAns > 0 || mgpe.gainNetContractuelEuros > 0) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {mgpe.dureeContratAns > 0 && (
              <KpiCard label="Durée contrat" value={`${mgpe.dureeContratAns} ans`} />
            )}
            {mgpe.gainNetContractuelEuros > 0 && (
              <KpiCard
                label="Gain net contractuel (pack)"
                value={formatEur(mgpe.gainNetContractuelEuros, true)}
                highlight
              />
            )}
          </div>
        )}
      </section>

      {/* 5. Loi ELAN */}
      <section className="mt-10 break-inside-avoid print:mt-8">
        <SectionTitle number={4} title="Argumentaire juridique (Loi ELAN)" />
        <blockquote className="mt-4 whitespace-pre-wrap border-l-4 border-line-strong bg-surface-sunken px-5 py-4 text-sm leading-relaxed text-ink-soft print:border-ink print:bg-surface-muted">
          {legalElan}
        </blockquote>
      </section>

      <footer className="mt-12 break-inside-avoid border-t border-line pt-6 text-xs leading-relaxed text-ink-muted print:mt-10">
        <p>{ALGORITHM_DISCLAIMER}</p>
        <p className="mt-2">{COPY.estimatesNote}</p>
        <p className="mt-2">
          Document généré via {COPY.productName} · {date} · Usage interne de prospection — non contractuel.
        </p>
      </footer>
    </article>
  );
}

function SectionTitle({ number, title }: { number: number; title: string }) {
  return (
    <h2 className="flex items-baseline gap-2 text-base font-semibold text-ink print:text-sm">
      <span className="font-mono text-sm text-ink-muted">Partie {number}</span>
      <span>{title}</span>
    </h2>
  );
}

function KpiCard({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="break-inside-avoid rounded-lg border border-line bg-surface-sunken p-4 print:rounded-none print:bg-white">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p
        className={cn(
          'mt-2 text-2xl font-bold tabular-nums tracking-tight print:text-xl',
          highlight && 'text-positive-text',
          accent && !highlight && 'text-warning-text',
          !highlight && !accent && 'text-ink',
        )}
      >
        {value}
      </p>
    </div>
  );
}
