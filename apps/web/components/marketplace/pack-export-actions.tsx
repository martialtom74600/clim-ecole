import { Download, FileCode, FileText } from 'lucide-react';
import Link from 'next/link';
import { COPY } from '@/lib/copy';

export function PackExportActions({ packId }: { packId: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <a
        href={`/api/marketplace/export/${packId}`}
        className="btn-secondary py-3"
        download
        title="Liste CRM — écoles, DPE, budgets, contacts"
      >
        <Download className="h-4 w-4" />
        Export CSV (CRM)
      </a>
      <a
        href={`/api/marketplace/export/${packId}?full=1`}
        className="btn-secondary py-3"
        download
        title="Toutes les colonnes disponibles — travaux, MGPE, artisans, énergie"
      >
        <Download className="h-4 w-4" />
        {COPY.exportCsvFull}
      </a>
      <a
        href={`/api/marketplace/dossier/${packId}`}
        className="btn-secondary py-3"
        download
        title="Dossier HTML prêt à imprimer — synthèse MGPE-PD"
      >
        <FileCode className="h-4 w-4" />
        {COPY.exportMgpeHtml}
      </a>
      <Link
        href={`/explorer/${packId}/note`}
        className="btn-primary py-3"
        title="Note d'opportunité A4 — marque blanche, prête à imprimer en PDF"
      >
        <FileText className="h-4 w-4" />
        Note d&apos;opportunité (PDF)
      </Link>
    </div>
  );
}
