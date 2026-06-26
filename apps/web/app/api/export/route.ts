import { NextResponse } from 'next/server';
import { loadProspectionData } from '@/lib/data';
import { isClosingChaud } from '@/lib/data';
import { requireAdminApi } from '@/lib/api-guard';

export async function GET(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter'); // chaud | pack | all

  const { rows } = await loadProspectionData();
  let filtered = rows;

  if (filter === 'chaud') {
    filtered = rows.filter((r) => isClosingChaud(r.closingTemperature));
  } else if (filter === 'pack') {
    filtered = rows.filter((r) => r.packCapexTotal > 1_000_000);
  }

  const headers = [
    'Code_UAI', 'Nom_Ecole', 'Commune', 'Code_EPCI', 'Classe_DPE',
    'CAPEX_Total', 'Closing_Temperature', 'Financement_Statut',
  ];

  const csvRows = filtered.map((r) =>
    [
      r.codeUai,
      `"${r.nomEcole.replace(/"/g, '""')}"`,
      r.commune,
      r.codeEpci,
      r.classeDpe,
      r.capexTotal,
      `"${r.closingTemperature}"`,
      r.financementStatut,
    ].join(','),
  );

  const csv = [headers.join(','), ...csvRows].join('\n');
  const filename =
    filter === 'chaud'
      ? 'clim-ecole-leads-chauds.csv'
      : filter === 'pack'
        ? 'clim-ecole-packs-1m.csv'
        : 'clim-ecole-export.csv';

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
