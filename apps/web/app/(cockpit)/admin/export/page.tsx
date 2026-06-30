import { ExportPanel } from '@/components/cockpit/export-panel';
import { CockpitVerdict } from '@/components/cockpit/cockpit-verdict';
import { ADMIN_VERDICTS } from '@/lib/site-narrative';

export default function AdminExportPage() {
  const v = ADMIN_VERDICTS.export;

  return (
    <>
      <CockpitVerdict label={v.label} headline={v.headline} subline={v.subline} />
      <main className="page-content">
        <ExportPanel />
      </main>
    </>
  );
}
