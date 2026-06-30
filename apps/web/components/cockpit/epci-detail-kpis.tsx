'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/info-tip';

const KPI_TIPS: Record<string, string> = {
  'Budget travaux': 'Coût total estimé des rénovations pour toutes les écoles du territoire.',
  'Aides publiques': 'Part prise en charge par l’État (Fonds Vert, DETR…) — réduit la facture.',
  'Reste à charge': 'Ce que la collectivité doit encore financer après les aides.',
  'Économie/an': 'Argent économisé chaque année sur les factures d’énergie.',
};

export function EpciDetailKpis({
  items,
}: {
  items: { label: string; value: string; accent: boolean }[];
}) {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, accent }) => (
        <Card
          key={label}
          className="transition-all duration-200 hover:border-line-strong hover:bg-zen-elevated"
        >
          <CardHeader>
            <CardTitle>
              <InfoTip label={KPI_TIPS[label] ?? label}>{label}</InfoTip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold tabular-nums tracking-tight ${
                accent ? 'text-zen-teal-dim' : 'text-ink'
              }`}
            >
              {value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
