import { CheckCircle2, Mail, Star } from 'lucide-react';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { PackExportActions } from '@/components/marketplace/pack-export-actions';

export function PostPurchaseChecklist({ packId }: { packId: string }) {
  return (
    <div className="card border-radar-signal/30 bg-radar-canvas p-6 md:p-8">
      <div className="flex items-center gap-2 text-radar-signal">
        <CheckCircle2 className="h-5 w-5" />
        <p className="font-semibold">{COPY.unlocked} — prochaines étapes</p>
      </div>
      <ol className="mt-4 space-y-2 text-sm">
        <li className="flex items-start gap-2">
          <span className="font-semibold text-radar-signal">1.</span>
          Contactez les mairies via les emails listés ci-dessous
        </li>
        <li className="flex items-start gap-2">
          <span className="font-semibold text-radar-signal">2.</span>
          Exportez le CSV (CRM) ou la note d&apos;opportunité (PDF)
        </li>
        <li className="flex items-start gap-2">
          <span className="font-semibold text-radar-signal">3.</span>
          Ajoutez ce territoire à vos favoris pour le retrouver
        </li>
      </ol>
      <div className="mt-6">
        <PackExportActions packId={packId} />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/compte" className="btn-ghost text-sm">
          <Mail className="h-4 w-4" />
          Mon compte
        </Link>
        <Link href="/explorer" className="btn-ghost text-sm">
          <Star className="h-4 w-4" />
          Explorer d&apos;autres territoires
        </Link>
      </div>
    </div>
  );
}
