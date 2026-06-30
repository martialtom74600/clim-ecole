import { Download, FileCode, FileText } from 'lucide-react';
import Link from 'next/link';
import { COPY } from '@/lib/copy';

const EXPORTS = [
  {
    href: (id: string) => `/api/marketplace/export/${id}`,
    icon: Download,
    label: 'Export CSV territoire',
    shortLabel: 'CSV',
    desc: 'Écoles, DPE, budgets et contacts mairies.',
    download: true,
    primary: false,
  },
  {
    href: (id: string) => `/api/marketplace/export/${id}?full=1`,
    icon: Download,
    label: COPY.exportCsvFull,
    shortLabel: 'CSV+',
    desc: 'Toutes les colonnes : travaux, MGPE, artisans, énergie, alertes.',
    download: true,
    primary: false,
  },
  {
    href: (id: string) => `/api/marketplace/dossier/${id}`,
    icon: FileCode,
    label: COPY.exportMgpeHtml,
    shortLabel: 'MGPE',
    desc: 'Dossier HTML prêt à imprimer — synthèse MGPE-PD pour le DGS.',
    download: true,
    primary: false,
  },
  {
    href: (id: string) => `/explorer/${id}/note`,
    icon: FileText,
    label: "Note d'opportunité (PDF)",
    shortLabel: 'PDF',
    desc: 'Document A4 marque blanche — idéal pour un premier rendez-vous mairie.',
    download: false,
    primary: true,
  },
] as const;

export function PackExportActions({
  packId,
  compact,
}: {
  packId: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {EXPORTS.map(({ href, icon: Icon, shortLabel, label, download }) => {
          const className =
            'inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink-soft shadow-sm transition-colors hover:bg-surface-muted';
          const content = (
            <>
              <Icon className="h-3.5 w-3.5" />
              {shortLabel}
            </>
          );
          if (download) {
            return (
              <a key={label} href={href(packId)} className={className} download title={label}>
                {content}
              </a>
            );
          }
          return (
            <Link key={label} href={href(packId)} className={className} title={label}>
              {content}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {EXPORTS.map(({ href, icon: Icon, label, desc, download, primary }) => {
        const className = primary
          ? 'btn-primary flex-col !items-start !gap-2 !py-4 !h-auto'
          : 'btn-secondary flex-col !items-start !gap-2 !py-4 !h-auto';
        const content = (
          <>
            <span className="flex items-center gap-2 font-semibold">
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </span>
            <span className="text-left text-xs font-normal opacity-80">{desc}</span>
          </>
        );
        if (download) {
          return (
            <a key={label} href={href(packId)} className={className} download>
              {content}
            </a>
          );
        }
        return (
          <Link key={label} href={href(packId)} className={className}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
