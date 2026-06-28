import { CheckCircle2, Kanban, Mail, Star } from 'lucide-react';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { PackExportActions } from '@/components/marketplace/pack-export-actions';

type Step = {
  n: number;
  title: string;
  body: string;
  href?: string;
};

const STEPS: Step[] = [
  {
    n: 1,
    title: 'Contactez les mairies',
    body: 'Utilisez les emails dans la section Prospecter. Personnalisez avec le gain net mairie.',
    href: '#prospecter',
  },
  {
    n: 2,
    title: 'Exportez vos supports',
    body: 'CSV pour votre CRM, dossier MGPE pour le montage financier, note PDF pour le RDV.',
  },
  {
    n: 3,
    title: 'Suivez dans Mon compte',
    body: 'Déplacez ce territoire dans votre pipeline (Contacté → RDV → Gagné/Perdu).',
    href: '/compte',
  },
];

export function PostPurchaseChecklist({ packId }: { packId: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 md:px-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {COPY.unlocked} — plan d&apos;action
        </div>
      </div>

      <div className="grid gap-px bg-slate-100 md:grid-cols-3">
        {STEPS.map(({ n, title, body, href }) => (
          <div key={n} className="bg-white px-5 py-4 md:px-6">
            <p className="text-xs font-bold text-slate-400">{n}</p>
            <p className="mt-1 font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{body}</p>
            {href &&
              (href.startsWith('/') ? (
                <Link href={href} className="mt-2 inline-block text-xs font-medium text-slate-700 underline">
                  Voir →
                </Link>
              ) : (
                <a href={href} className="mt-2 inline-block text-xs font-medium text-slate-700 underline">
                  Voir →
                </a>
              ))}
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 px-5 py-5 md:px-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Téléchargements
        </p>
        <PackExportActions packId={packId} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4 md:px-6">
        <Link href="/compte" className="btn-secondary text-sm">
          <Kanban className="h-4 w-4" />
          Pipeline
        </Link>
        <Link href="/explorer" className="btn-ghost text-sm">
          <Star className="h-4 w-4" />
          Autres territoires
        </Link>
        <a href="#prospecter" className="btn-ghost text-sm">
          <Mail className="h-4 w-4" />
          Contacts
        </a>
      </div>
    </div>
  );
}
