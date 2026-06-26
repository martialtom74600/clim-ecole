import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Flame, Layers, FileSpreadsheet } from 'lucide-react';
import { getDashboardKpis } from '@/lib/data';

export async function ExportPanel() {
  const kpis = await getDashboardKpis();
  const EXPORTS = [
    {
      id: 'all',
      title: 'Export complet',
      desc: `${kpis.totalBatiments} écoles · colonnes essentielles`,
      filter: '',
      icon: FileSpreadsheet,
    },
    {
      id: 'chaud',
      title: 'Priorités immédiates',
      desc: 'Uniquement les dossiers urgents',
      filter: 'chaud',
      icon: Flame,
    },
    {
      id: 'pack',
      title: 'Gros territoires',
      desc: 'Budget travaux supérieur à 1 M€',
      filter: 'pack',
      icon: Layers,
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {EXPORTS.map(({ id, title, desc, filter, icon: Icon }) => (
        <Card key={id}>
          <CardHeader>
            <Icon className="mb-2 h-5 w-5 text-slate-500" strokeWidth={1.75} />
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">{desc}</p>
            <a
              href={`/api/export${filter ? `?filter=${filter}` : ''}`}
              className="btn-secondary mt-4 inline-flex text-sm"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
