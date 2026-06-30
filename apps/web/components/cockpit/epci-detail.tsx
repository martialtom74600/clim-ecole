import { getEpciByCode, temperatureLevel } from '@/lib/data';
import { formatEur, formatInt } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/layout/page-header';
import { DpeBadge, StatutProjetBadge, TemperatureBadge } from '@/components/cockpit/badges';
import { EpciDetailKpis } from '@/components/cockpit/epci-detail-kpis';
import { DossierDownloadButton } from '@/components/cockpit/dossier-download-button';
import { Map } from 'lucide-react';
import Link from 'next/link';

function FinanceBreakdown({
  capex,
  subventions,
  reste,
}: {
  capex: number;
  subventions: number;
  reste: number;
}) {
  const total = capex || 1;
  const subPct = Math.min(100, (subventions / total) * 100);
  const racPct = Math.min(100 - subPct, (reste / total) * 100);

  return (
    <Card className="mb-8 overflow-hidden">
      <CardHeader className="border-b border-line pb-3">
        <CardTitle className="normal-case tracking-normal text-sm text-ink-soft">
          Qui paie quoi ?
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="mb-3 text-xs text-ink-muted">
          Barre bleue = aides de l’État · Barre verte = part restant à la collectivité
        </p>
        <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-zen-bg">
          <div
            className="bg-info transition-all duration-500"
            style={{ width: `${subPct}%` }}
            title="Subventions"
          />
          <div
            className="bg-zen-teal-dim transition-all duration-500"
            style={{ width: `${racPct}%` }}
            title="Reste à charge"
          />
        </div>
        <div className="flex flex-wrap gap-6 text-xs text-ink-muted">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-info" />
            Subventions (aides État) {formatEur(subventions, true)}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-zen-teal-dim" />
            Reste à charge collectivité {formatEur(reste, true)}
          </span>
          <span className="tabular-nums">Total {formatEur(capex, true)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export async function EpciDetailView({ code }: { code: string }) {
  const epci = await getEpciByCode(code);
  if (!epci) return null;

  const kpis = [
    { label: 'Budget travaux', value: formatEur(epci.packCapexTotal, true), accent: false },
    { label: 'Aides publiques', value: formatEur(epci.subventionsTotal, true), accent: false },
    { label: 'Reste à charge', value: formatEur(epci.resteAChargeTotal, true), accent: true },
    { label: 'Économie/an', value: `${formatEur(epci.gainNetMairieTotal, true)}/an`, accent: false },
  ];

  return (
    <>
      <PageHeader
        title={epci.displayName}
        description={epci.communesLabel || `Code ${epci.codeEpci}`}
        breadcrumb={[
          { label: 'Intercommunalités', href: '/admin/epci' },
          { label: epci.codeEpci },
        ]}
        count={epci.batimentCount}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <TemperatureBadge label={epci.temperatureGlobale} level={epci.temperatureLevel} />
          <StatutProjetBadge statut={epci.statutProjetEpci} />
          <Link
            href={`/admin/carte?epci=${epci.codeEpci}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-muted transition-all duration-200 hover:border-line-strong hover:text-ink"
          >
            <Map className="h-3.5 w-3.5" />
            Voir sur la carte
          </Link>
        </div>
        <DossierDownloadButton code={code} />
      </div>

      <FinanceBreakdown
        capex={epci.packCapexTotal}
        subventions={epci.subventionsTotal}
        reste={epci.resteAChargeTotal}
      />

      <EpciDetailKpis items={kpis} />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-line pb-4">
          <CardTitle className="normal-case tracking-normal text-sm text-ink-soft">
            Écoles de ce territoire ({formatInt(epci.batimentCount)})
          </CardTitle>
          <p className="mt-1 text-xs text-ink-muted">
            DPE = note énergétique (F/G = passoire · priorité rénovation)
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>École</TableHead>
                <TableHead>Commune</TableHead>
                <TableHead title="Diagnostic Performance Énergétique">Note DPE</TableHead>
                <TableHead className="text-right">Surface</TableHead>
                <TableHead className="text-right">Budget travaux</TableHead>
                <TableHead>Urgence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {epci.batiments.map((b) => (
                <TableRow key={b.codeUai}>
                  <TableCell className="font-medium text-ink">{b.nomEcole}</TableCell>
                  <TableCell className="text-ink-muted">{b.commune}</TableCell>
                  <TableCell>
                    <DpeBadge classe={b.classeDpe} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-ink-muted">
                    {formatInt(b.surfaceM2)} m²
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-ink">
                    {formatEur(b.capexTotal, true)}
                  </TableCell>
                  <TableCell>
                    <TemperatureBadge
                      label={b.closingTemperature}
                      level={temperatureLevel(b.closingTemperature)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
