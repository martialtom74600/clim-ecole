'use client';

import { Printer } from 'lucide-react';
import type { MarketplacePackDetail } from '@/lib/types';
import { formatEur, formatInt, formatPct } from '@/lib/format';
import { COPY } from '@/lib/copy';
import { ALGORITHM_DISCLAIMER } from '@/lib/legal';
import { cn } from '@/lib/utils';

const DPE_PRINT: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-900 print:bg-emerald-50',
  B: 'bg-lime-100 text-lime-900 print:bg-lime-50',
  C: 'bg-yellow-100 text-yellow-900 print:bg-yellow-50',
  D: 'bg-amber-100 text-amber-900 print:bg-amber-50',
  E: 'bg-orange-100 text-orange-900 print:bg-orange-50',
  F: 'bg-red-100 text-red-900 print:bg-red-50',
  G: 'bg-red-200 text-red-950 print:bg-red-100',
};

function DpePrintBadge({ classe }: { classe: string }) {
  const letter = classe?.charAt(0)?.toUpperCase() ?? '?';
  const style = DPE_PRINT[letter] ?? 'bg-slate-100 text-slate-800';

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
  const racTotal = resteAChargeAfterSubsTotal ?? pack.packCapexTotal - pack.subventionsTotal;
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
        'mx-auto max-w-[210mm] bg-white text-slate-900',
        'print:max-w-none print:shadow-none print:bg-white',
        className,
      )}
    >
      {showPrintButton && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="text-sm text-radar-muted">
            Document prêt pour impression A4 — ajoutez le logo de votre cabinet avant d&apos;imprimer.
          </p>
          <OpportunityNotePrintButton />
        </div>
      )}

      {/* 1. En-tête marque blanche */}
      <header className="break-inside-avoid border-b-2 border-slate-900 pb-6 print:pb-5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div
            className="flex h-20 w-44 shrink-0 items-center justify-center rounded border-2 border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-500 print:h-16 print:w-40"
            aria-label="Emplacement logo du cabinet"
          >
            Logo du cabinet
          </div>
          <div className="text-right text-sm text-slate-500 print:text-xs">
            <p>{date}</p>
            <p className="mt-1">{pack.department}</p>
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-semibold leading-tight tracking-tight print:mt-5 print:text-xl">
          Note d&apos;opportunité — Rénovation énergétique du patrimoine scolaire
        </h1>
        <p className="mt-2 text-lg text-slate-700 print:text-base">{pack.publicName}</p>
        <p className="mt-1 text-sm text-slate-500">
          {pack.batimentCount} établissement{pack.batimentCount > 1 ? 's' : ''}
          {nomEpci ? ` · ${nomEpci}` : ' · intercommunalité'}
          {communesLabel ? ` · ${communesLabel}` : ''}
        </p>
      </header>

      {/* 2. État des lieux */}
      <section className="mt-8 break-inside-avoid print:mt-6">
        <SectionTitle number={1} title="État des lieux — baseline énergétique" />
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 print:rounded-none print:border-slate-300">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-600 print:bg-slate-100">
                <th className="px-4 py-3 font-semibold">Bâtiment</th>
                <th className="px-4 py-3 font-semibold">Commune</th>
                <th className="px-4 py-3 font-semibold">DPE</th>
                <th className="px-4 py-3 text-right font-semibold">Surface (m²)</th>
                <th className="px-4 py-3 text-right font-semibold">CAPEX</th>
                <th className="px-4 py-3 text-right font-semibold">Gain net/an</th>
                <th className="px-4 py-3 font-semibold">Contact mairie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buildings.map((b) => (
                <tr key={b.buildingId} className="break-inside-avoid">
                  <td className="px-4 py-3 font-medium">{b.realName ?? b.publicName}</td>
                  <td className="px-4 py-3 text-slate-600">{b.realCommune ?? b.publicCommune}</td>
                  <td className="px-4 py-3">
                    <DpePrintBadge classe={b.classeDpe} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatInt(b.surfaceM2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatEur(b.capexTotal, true)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-teal-700">
                    {formatEur(b.gainNetMairie, true)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
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
          <p className="mt-4 text-sm text-slate-600">
            {COPY.partFondsVert} :{' '}
            <strong className="font-semibold text-slate-900">
              {formatEur(pack.resteAChargeTotal, true)}
            </strong>
          </p>
        )}
        {pack.fondsVertPotential > 0 && (
          <p className="mt-4 text-sm text-slate-600">
            Dont potentiel Fonds Vert estimé :{' '}
            <strong className="font-semibold text-slate-900">
              {formatEur(pack.fondsVertPotential, true)}
            </strong>
            {pack.subventionRatio > 0 && (
              <span className="text-slate-500"> · taux global {formatPct(pack.subventionRatio)}</span>
            )}
          </p>
        )}
        <div className="mt-6 break-inside-avoid">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Répartition subventions / reste à charge
          </p>
          <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100 print:border print:border-slate-300">
            <div
              className="bg-teal-600 print:bg-teal-700"
              style={{ width: `${subPct}%` }}
              title="Subventions"
            />
            <div
              className="bg-amber-500 print:bg-amber-600"
              style={{ width: `${racPct}%` }}
              title="Reste à charge"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
            <span>Subventions {formatEur(pack.subventionsTotal, true)} ({formatPct(pack.subventionRatio)})</span>
            <span>RAC {formatEur(racTotal, true)}</span>
          </div>
        </div>
      </section>

      {/* 4. MGPE-PD */}
      <section className="mt-10 break-inside-avoid print:mt-8">
        <SectionTitle number={3} title="Modèle de tiers-financement (MGPE-PD)" />
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{mgpeText}</p>
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
        <blockquote className="mt-4 whitespace-pre-wrap border-l-4 border-slate-400 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-700 print:border-slate-600 print:bg-slate-100">
          {legalElan}
        </blockquote>
      </section>

      <footer className="mt-12 break-inside-avoid border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500 print:mt-10">
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
    <h2 className="flex items-baseline gap-2 text-base font-semibold text-slate-900 print:text-sm">
      <span className="font-mono text-sm text-slate-500">Partie {number}</span>
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
    <div className="break-inside-avoid rounded-lg border border-slate-200 bg-slate-50 p-4 print:rounded-none print:bg-white">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-2 text-2xl font-bold tabular-nums tracking-tight print:text-xl',
          highlight && 'text-teal-700',
          accent && !highlight && 'text-amber-700',
          !highlight && !accent && 'text-slate-900',
        )}
      >
        {value}
      </p>
    </div>
  );
}
