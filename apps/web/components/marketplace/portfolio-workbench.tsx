'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, Layers, Mail, TrendingDown, Wallet } from 'lucide-react';
import { formatEur, formatInt } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface DepartmentAggregate {
  code: string;
  label: string;
  packCount: number;
  ecoles: number;
  capex: number;
  subventions: number;
  rac: number;
  gainNetAn: number;
  ceeEuros: number;
  qualified: number;
}

/**
 * National bundling workbench for the institutional / Data Room tier:
 * funds, Banque des Territoires, STF/SPL. Select departments to assemble a
 * financing portfolio (SPV) and read the aggregated capital need live.
 */
export function PortfolioWorkbench({
  departments,
  national,
}: {
  departments: DepartmentAggregate[];
  national: { capex: number; subventions: number; rac: number; ecoles: number; packs: number };
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const portfolio = useMemo(() => {
    const picked = selected.length
      ? departments.filter((d) => selected.includes(d.code))
      : departments;
    return picked.reduce(
      (acc, d) => ({
        capex: acc.capex + d.capex,
        subventions: acc.subventions + d.subventions,
        rac: acc.rac + d.rac,
        gainNetAn: acc.gainNetAn + d.gainNetAn,
        ecoles: acc.ecoles + d.ecoles,
        packs: acc.packs + d.packCount,
      }),
      { capex: 0, subventions: 0, rac: 0, gainNetAn: 0, ecoles: 0, packs: 0 },
    );
  }, [departments, selected]);

  const subRatio = portfolio.capex > 0 ? portfolio.subventions / portfolio.capex : 0;
  const isAll = selected.length === 0;

  function toggle(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[7fr_5fr]">
      {/* Left — department gisement table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="font-semibold text-ink">Gisement par département</p>
            <p className="text-xs text-ink-muted">
              Sélectionnez les départements à agréger dans un portefeuille SPV
            </p>
          </div>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="text-xs font-medium text-ink-muted underline hover:text-ink"
            >
              Tout réinitialiser
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-surface-sunken text-left">
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-2.5 font-medium">Département</th>
                <th className="px-3 py-2.5 text-right font-medium">Écoles</th>
                <th className="px-3 py-2.5 text-right font-medium">CAPEX</th>
                <th className="px-4 py-2.5 text-right font-medium">RAC à financer</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => {
                const active = isAll || selected.includes(d.code);
                return (
                  <tr
                    key={d.code}
                    onClick={() => toggle(d.code)}
                    className={cn(
                      'cursor-pointer border-b border-line transition-colors hover:bg-surface-sunken',
                      !isAll && selected.includes(d.code) && 'bg-surface-muted',
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded border text-[10px]',
                            !isAll && selected.includes(d.code)
                              ? 'border-ink bg-ink text-white'
                              : 'border-line-strong text-transparent',
                          )}
                        >
                          ✓
                        </span>
                        <div className="min-w-0">
                          <p className={cn('truncate font-medium', active ? 'text-ink' : 'text-ink-muted')}>
                            {d.label}
                          </p>
                          <p className="text-[11px] text-ink-subtle">
                            {d.packCount} territoire{d.packCount > 1 ? 's' : ''} · {d.qualified} prioritaire
                            {d.qualified > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink-soft">
                      {formatInt(d.ecoles)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink">
                      {formatEur(d.capex, true)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums text-warning-text">
                      {formatEur(d.rac, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right — live portfolio */}
      <div className="flex flex-col gap-4">
        <div className="sticky top-20 flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-line bg-ink text-white shadow-overlay">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
              <Layers className="h-4 w-4 text-white/70" />
              <span className="text-sm font-semibold">
                Portefeuille {isAll ? 'national' : `· ${selected.length} dépt.`}
              </span>
              <span className="ml-auto text-xs text-white/60">{formatInt(portfolio.packs)} territoires</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-white/10">
              <PortfolioFigure label="CAPEX agrégé" value={formatEur(portfolio.capex, true)} icon={<Building2 className="h-4 w-4" />} />
              <PortfolioFigure label="Écoles" value={formatInt(portfolio.ecoles)} />
            </div>
            <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10">
              <PortfolioFigure
                label="Subventions"
                value={formatEur(portfolio.subventions, true)}
                sub={`${Math.round(subRatio * 100)} %`}
                tone="positive"
              />
              <PortfolioFigure
                label="Besoin de financement privé"
                value={formatEur(portfolio.rac, true)}
                tone="warning"
                icon={<TrendingDown className="h-4 w-4" />}
              />
            </div>
          </div>

          <div className="card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Wallet className="h-4 w-4 text-ink-muted" />
              Lecture investisseur
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {formatInt(portfolio.ecoles)} écoles agrégées en un véhicule unique (SPV) :{' '}
              <strong className="text-ink">{formatEur(portfolio.rac, true)}</strong> à préfinancer après
              subventions, remboursés par des loyers MGPE-PD lissés sur 15 ans —{' '}
              risque collectivité quasi souverain, éligible label Greenfin.
            </p>
            <a
              href="mailto:contact@clim-ecole.fr?subject=Cl%C3%ADm%20%C3%89cole%20%E2%80%94%20Data%20Room%20National"
              className="btn-primary mt-4 w-full"
            >
              <Mail className="h-4 w-4" />
              Demander l&apos;accès Data Room
            </a>
            <Link href="/tarifs?plan=dataroom" className="btn-ghost mt-1 w-full">
              Voir l&apos;offre · 5 000 €/mois
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <p className="px-1 text-[11px] leading-relaxed text-ink-subtle">
            Périmètre national consolidé : {formatEur(national.capex, true)} de CAPEX,{' '}
            {formatEur(national.rac, true)} de reste à charge sur {formatInt(national.ecoles)} écoles.
            Estimations indicatives — données rafraîchies en continu.
          </p>
        </div>
      </div>
    </div>
  );
}

function PortfolioFigure({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'positive' | 'warning';
  icon?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/55">
        {icon}
        {label}
      </div>
      <p
        className={cn(
          'mt-1 font-mono text-2xl font-semibold tabular-nums',
          tone === 'positive' && 'text-positive',
          tone === 'warning' && 'text-warning',
          !tone && 'text-white',
        )}
      >
        {value}
        {sub && <span className="ml-1.5 text-xs font-normal text-white/50">{sub}</span>}
      </p>
    </div>
  );
}
