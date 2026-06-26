import Link from 'next/link';
import { getTopEpciTriage } from '@/lib/data';
import { formatEpciDisplayName, formatEur, formatInt } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatutProjetBadge } from '@/components/cockpit/badges';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

export async function QuickTriage() {
  const rows = await getTopEpciTriage(5);

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:border-white/[0.12]">
      <CardHeader className="flex-row items-end justify-between pb-2">
        <div>
          <CardTitle className="text-[15px] text-zinc-200">Top 5 territoires</CardTitle>
          <p className="mt-1.5 text-sm text-zen-muted">
            Les plus gros budgets travaux — clique pour ouvrir la fiche
          </p>
        </div>
        <Link href="/admin/epci" className="text-zinc-600 transition-colors hover:text-zen-teal">
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/[0.06]">
          {rows.map((row, index) => (
            <Link
              key={row.codeEpci}
              href={`/admin/epci/${row.codeEpci}`}
              className="group flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-zen-teal/[0.04] sm:gap-5 sm:px-6 sm:py-5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-zen-bg text-xs font-bold tabular-nums text-zinc-500 transition-colors group-hover:border-zen-teal-dim/30 group-hover:text-zen-teal-dim">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-zinc-100 group-hover:text-zen-teal-dim">
                    {formatEpciDisplayName(row.nomEpci, row.codeEpci)}
                  </h3>
                  <StatutProjetBadge statut={row.statutProjetEpci} />
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {formatInt(row.batimentCount)} bâtiment{row.batimentCount > 1 ? 's' : ''}
                  {' · '}
                  Score max {row.scoreMax}
                </p>
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold tabular-nums text-zinc-100">
                  {formatEur(row.packCapexTotal, true)}
                </p>
                <p className="text-xs tabular-nums text-zinc-500">
                  Gain {formatEur(row.packGainNetPessimiste, true)}/an
                </p>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-700 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-zen-teal-dim" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
