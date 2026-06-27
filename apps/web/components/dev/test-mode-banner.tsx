import Link from 'next/link';
import { isTestMode } from '@/lib/test-mode';

export function TestModeBanner() {
  if (!isTestMode()) return null;

  return (
    <div
      className="border-b border-emerald-600/30 bg-emerald-500/10 px-4 py-2.5 text-center text-sm text-emerald-950"
      role="status"
    >
      <strong>Accès complet sans paiement</strong> — même vue qu&apos;un client qui a acheté.{' '}
      <Link href="/explorer" className="font-semibold underline underline-offset-2">
        Ouvrir l&apos;explorateur
      </Link>
      {' · '}
      <span className="text-emerald-900/80">
        (pas l&apos;admin — c&apos;est <code className="rounded bg-emerald-500/15 px-1">/explorer</code>)
      </span>
    </div>
  );
}
