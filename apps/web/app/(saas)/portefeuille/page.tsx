import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Database, Radar } from 'lucide-react';
import { getMarketplacePacksRaw, getMarketplaceGlobalStats } from '@/lib/marketplace';
import { getCoverageBadge } from '@/lib/coverage';
import { parseDepartmentCode } from '@/lib/geo';
import { formatEur, formatInt } from '@/lib/format';
import { PAGE_VERDICTS } from '@/lib/site-narrative';
import {
  NarrativeAction,
  NarrativeKpiGrid,
  NarrativeSection,
  NarrativeVerdict,
} from '@/components/layout/narrative-page';
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

  const { label, headline, subline } = PAGE_VERDICTS.portefeuille;

  return (
    <div>
      <NarrativeVerdict label={label} headline={headline} subline={subline}>
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-muted shadow-sm">
          <Database className="h-3.5 w-3.5" />
          Data Room National · {coverageBadge}
        </p>
        <NarrativeKpiGrid
          className="mt-8 shadow-raised"
          items={[
            { label: 'CAPEX national identifié', value: formatEur(national.capex, true) },
            { label: 'Reste à charge agrégé', value: formatEur(national.rac, true), accent: true },
            { label: 'Écoles passoires F/G', value: formatInt(national.ecoles) },
            { label: 'Territoires', value: formatInt(stats.epciCount) },
          ]}
        />
      </NarrativeVerdict>

      <NarrativeSection
        id="workbench"
        title="Workbench de bundling"
        description="Sélectionnez des départements — CAPEX et RAC se recalculent en temps réel."
      >
        <PortfolioWorkbench departments={departments} national={national} />
      </NarrativeSection>

      <NarrativeAction
        title="Besoin d'un périmètre national complet ?"
        description="Accès API, bundling multi-EPCI et SLA de fraîcheur."
      >
        <Link href="/tarifs?plan=dataroom" className="btn-primary">
          Découvrir la Data Room
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/finance" className="btn-secondary">
          <Radar className="h-4 w-4" />
          Page Finance
        </Link>
      </NarrativeAction>
    </div>
  );
}
