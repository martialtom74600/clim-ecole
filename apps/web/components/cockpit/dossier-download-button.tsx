'use client';

import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';

export function DossierDownloadButton({ code }: { code: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }

  return (
    <a
      href={`/api/dossier/${code}`}
      download
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zen-teal px-5 py-2.5 text-[15px] font-semibold text-zen-bg transition-all duration-200 hover:opacity-90 sm:ml-auto sm:w-auto"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" strokeWidth={1.75} />
      )}
      Télécharger le dossier
      <Download className="h-3.5 w-3.5 opacity-70" />
    </a>
  );
}
