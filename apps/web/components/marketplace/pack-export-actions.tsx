'use client';

import { Download, FileText } from 'lucide-react';

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
      <a
        href={`/api/marketplace/dossier/${packId}`}
        className="btn-secondary flex-1 py-3"
        download
        title="Document PDF de montage financier pour présenter le projet à la collectivité"
      >
        <FileText className="h-4 w-4" />
        Export PDF montage
      </a>
    </div>
  );
}
