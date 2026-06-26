import { DATA_SOURCES_LINE } from '@/lib/legal';
import { Database, LineChart, RefreshCw } from 'lucide-react';

export function ReassuranceBand() {
  const items = [
    { icon: Database, label: 'Données BDNB certifiées' },
    { icon: LineChart, label: 'Modélisation MGPE-PD' },
    { icon: RefreshCw, label: 'Mise à jour T3 2026' },
  ];

  return (
    <div className="border-b border-radar-border bg-radar-surface">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <p className="label-caps md:sr-only">{DATA_SOURCES_LINE}</p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {items.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-2 text-sm text-radar-muted">
              <Icon className="h-4 w-4 shrink-0 text-radar-signal" strokeWidth={1.75} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
