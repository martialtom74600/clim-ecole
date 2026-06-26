import { formatEur, formatInt } from '@/lib/format';
import type { MarketplaceGlobalStats } from '@/lib/types';

export function MetricsTicker({ stats }: { stats: MarketplaceGlobalStats }) {
  const items = [
    { label: 'CAPEX total', value: formatEur(stats.totalPackCapex, true) },
    { label: 'Écoles', value: formatInt(stats.totalBatiments) },
    { label: 'Territoires', value: formatInt(stats.epciCount) },
    { label: 'Leads chauds', value: formatInt(stats.leadsChauds) },
    { label: 'Subventions', value: formatEur(stats.totalSubventions, true) },
    { label: 'RAC total', value: formatEur(stats.totalResteACharge, true) },
  ];

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-radar-border bg-radar-elevated py-3">
      <div className="flex animate-ticker whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={`${item.label}-${i}`} className="mx-8 inline-flex items-center gap-3 text-sm">
            <span className="label-caps">{item.label}</span>
            <span className="font-semibold tabular-nums text-radar-text">{item.value}</span>
            <span className="text-radar-border-strong">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
