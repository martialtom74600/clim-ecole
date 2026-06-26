import { PageHeader } from '@/components/layout/page-header';
import { ExportPanel } from '@/components/cockpit/export-panel';

export default function AdminExportPage() {
  return (
    <main className="page-content">
      <PageHeader
        title="Export données"
        description="Extractions CSV depuis output_prospection.csv"
      />
      <ExportPanel />
    </main>
  );
}
