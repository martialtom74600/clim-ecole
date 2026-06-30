'use client';

import { formatEur, formatInt } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/info-tip';
import { Flame, Building2, Layers, Euro } from 'lucide-react';
import type { DashboardKpis } from '@/lib/types';

export function KpiCardsView({ kpis }: { kpis: DashboardKpis }) {
  const cards = [
    {
      title: 'Budget travaux total',
      tip: 'Somme de tous les devis travaux (PAC, isolation…) pour les écoles du fichier.',
      value: formatEur(kpis.totalCapex, true),
      sub: formatEur(kpis.totalCapex),
      icon: Euro,
      accent: false,
    },
    {
      title: 'Écoles recensées',
      tip: 'Nombre de bâtiments scolaires dans ton fichier, répartis sur plusieurs intercommunalités.',
      value: formatInt(kpis.totalBatiments),
      sub: `${formatInt(kpis.epciUniques)} territoires`,
      icon: Building2,
      accent: false,
    },
    {
      title: 'Priorités immédiates',
      tip: 'Dossiers très favorables — bon budget, bon financement. À appeler en premier.',
      value: formatInt(kpis.leadsChauds),
      sub: `${formatInt(kpis.leadsTiedes)} à creuser`,
      icon: Flame,
      accent: true,
    },
    {
      title: 'Lots intercommunes',
      tip: 'Projets où plusieurs écoles d’un même territoire peuvent être financées ensemble.',
      value: formatInt(kpis.packEpciFinancables),
      sub: `${formatInt(kpis.soloFinancables)} écoles seules OK`,
      icon: Layers,
      accent: false,
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ title, tip, value, sub, icon: Icon, accent }) => (
        <Card key={title} className={accent ? 'border-zen-teal/20' : undefined}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>
              <InfoTip label={tip}>{title}</InfoTip>
            </CardTitle>
            <Icon
              className={`h-5 w-5 ${accent ? 'text-zen-teal' : 'text-ink-subtle'}`}
              strokeWidth={1.75}
            />
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-semibold tabular-nums tracking-tight ${
                accent ? 'text-zen-teal' : 'text-ink'
              }`}
            >
              {value}
            </p>
            <p className="mt-1.5 text-sm tabular-nums text-zen-muted">{sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
