import { Download, FileText } from 'lucide-react';
import Link from 'next/link';

export function PackExportActions({ packId }: { packId: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a
        href={`/api/marketplace/export/${packId}`}
        className="btn-secondary flex-1 py-3"
        download
        title="Liste des écoles avec DPE, surfaces, budgets — pour votre CRM"
      >
        <Download className="h-4 w-4" />
        Export CSV (CRM)
      </a>
      <Link
        href={`/explorer/${packId}/note`}
        className="btn-primary flex-1 py-3"
        title="Note d'opportunité A4 — marque blanche, prête à imprimer en PDF"
      >
        <FileText className="h-4 w-4" />
        Note d&apos;opportunité (PDF)
      </Link>
    </div>
  );
}
