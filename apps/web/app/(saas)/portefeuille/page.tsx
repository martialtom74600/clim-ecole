import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Database, Radar } from 'lucide-react';
import { getMarketplacePacksRaw, getMarketplaceGlobalStats } from '@/lib/marketplace';
import { getCoverageBadge } from '@/lib/coverage';
import { parseDepartmentCode } from '@/lib/geo';
import { formatEur, formatInt } from '@/lib/format';
import {
  PortfolioWorkbench,
  type DepartmentAggregate,
} from '@/components/marketplace/portfolio-workbench';

export const metadata: Metadata = {
  title: 'Portefeuille national — Clim École',
  description:
    'Agrégez les écoles passoires thermiques en portefeuille SPV : CAPEX, subventions et reste à charge consolidés par département pour fonds, banques publiques et tiers-financeurs.',
};

export default async function PortefeuillePage() {
  const [packs, stats, coverageBadge] = await Promise.all([
    getMarketplacePacksRaw(),
    getMarketplaceGlobalStats(),
    getCoverageBadge(),
  ]);

  const byDept = new Map<string, DepartmentAggregate>();
  for (const p of packs) {
    const code = parseDepartmentCode(p.department) || p.department;
    const agg =
      byDept.get(code) ??
      {
        code,
        label: p.department,
        packCount: 0,
        ecoles: 0,
        capex: 0,
        subventions: 0,
        rac: 0,
        gainNetAn: 0,
        ceeEuros: 0,
        qualified: 0,
      };
    agg.packCount += 1;
    agg.ecoles += p.batimentCount;
    agg.capex += p.packCapexTotal;
    agg.subventions += p.subventionsTotal;
    agg.rac += p.resteAChargeTotal;
    agg.gainNetAn += p.gainNetMairieTotal;
    agg.ceeEuros += p.ceeEurosTotal ?? 0;
    if (p.isQualified) agg.qualified += 1;
    byDept.set(code, agg);
  }

  const departments = [...byDept.values()].sort((a, b) => b.capex - a.capex);

  const national = departments.reduce(
    (acc, d) => ({
      capex: acc.capex + d.capex,
      subventions: acc.subventions + d.subventions,
      rac: acc.rac + d.rac,
      ecoles: acc.ecoles + d.ecoles,
      packs: acc.packs + d.packCount,
    }),
    { capex: 0, subventions: 0, rac: 0, ecoles: 0, packs: 0 },
  );

  return (
    <div className="page-content">
      <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-muted shadow-sm">
        <Database className="h-3.5 w-3.5" />
        Data Room National · {coverageBadge}
      </p>

      <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight md:text-display-md">
        Agrégez un parc scolaire entier en portefeuille finançable
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
        Pour les fonds d&apos;infrastructure, la Banque des Territoires, les SPL et tiers-financeurs :
        regroupez des dizaines d&apos;écoles passoires en un véhicule unique (SPV) et lisez le besoin de
        capital privé après subventions, en temps réel.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-raised sm:grid-cols-4">
        <HeadlineStat label="CAPEX national identifié" value={formatEur(national.capex, true)} />
        <HeadlineStat label="Reste à charge agrégé" value={formatEur(national.rac, true)} accent />
        <HeadlineStat label="Écoles passoires F/G" value={formatInt(national.ecoles)} />
        <HeadlineStat label="Territoires" value={formatInt(stats.epciCount)} />
      </div>

      <div className="mt-10">
        <PortfolioWorkbench departments={departments} national={national} />
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface-sunken p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white">
            <Radar className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-ink">Besoin d&apos;un périmètre national complet ?</p>
            <p className="text-sm text-ink-muted">Accès API, bundling multi-EPCI et SLA de fraîcheur.</p>
          </div>
        </div>
        <Link href="/tarifs?plan=dataroom" className="btn-primary">
          Découvrir la Data Room
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function HeadlineStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white px-4 py-4">
      <dd className={`font-mono text-2xl font-semibold tabular-nums ${accent ? 'text-warning-text' : 'text-ink'}`}>
        {value}
      </dd>
      <dt className="mt-1 text-[11px] leading-tight text-ink-muted">{label}</dt>
    </div>
  );
}
