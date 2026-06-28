import { Download, FileCode, FileText } from 'lucide-react';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { DossierPackPipeline } from '@/components/marketplace/dossier-pack-pipeline';

const EXPORTS = [
  {
    href: (id: string) => `/api/marketplace/export/${id}`,
    icon: Download,
    label: 'CSV CRM',
    desc: 'Écoles, DPE, budgets, contacts',
    download: true,
  },
  {
    href: (id: string) => `/api/marketplace/export/${id}?full=1`,
    icon: Download,
    label: 'CSV complet',
    desc: 'Toutes colonnes MGPE, artisans, alertes',
    download: true,
  },
  {
    href: (id: string) => `/api/marketplace/dossier/${id}`,
    icon: FileCode,
    label: COPY.exportMgpeHtml,
    desc: 'Dossier HTML MGPE-PD',
    download: true,
  },
  {
    href: (id: string) => `/explorer/${id}/note`,
    icon: FileText,
    label: 'Note PDF',
    desc: 'Document A4 marque blanche',
    download: false,
    primary: true,
  },
] as const;

export function DossierTabExports({ packId }: { packId: string }) {
  return (
    <div className="flex h-full min-h-0 items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-2xl space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Téléchargements</p>
          <p className="text-xs text-slate-500">Exports prêts pour votre CRM ou vos rendez-vous</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {EXPORTS.map(({ href, icon: Icon, label, desc, download, ...rest }) => {
            const primary = 'primary' in rest && rest.primary;
            const className = primary
              ? 'flex items-start gap-3 rounded-lg border border-slate-900 bg-slate-900 p-4 text-left text-white transition-opacity hover:opacity-90'
              : 'flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50';

            const content = (
              <>
                <Icon className={cnIcon(primary, 'mt-0.5 h-4 w-4 shrink-0')} />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className={cnDesc(primary)}>{desc}</span>
                </span>
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

        <DossierPackPipeline packId={packId} />
      </div>
    </div>
  );
}

function cnIcon(primary: boolean | undefined, base: string) {
  return primary ? `${base} text-white/90` : `${base} text-slate-500`;
}

function cnDesc(primary: boolean | undefined) {
  return primary ? 'mt-0.5 block text-xs text-white/70' : 'mt-0.5 block text-xs text-slate-500';
}
