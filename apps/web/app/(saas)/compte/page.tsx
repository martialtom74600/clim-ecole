'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, LogOut } from 'lucide-react';
import { formatEur } from '@/lib/format';
import { COPY } from '@/lib/copy';
import { AlertPreferencesPanel } from '@/components/marketplace/alert-preferences';

interface UnlockedPack {
  packId: string;
  name: string;
  department?: string;
  capex?: number;
}

interface AccountState {
  authenticated: boolean;
  email?: string;
  pro?: boolean;
  proUntil?: string | null;
  packIds?: string[];
  packs?: UnlockedPack[];
}

export default function ComptePage() {
  const [account, setAccount] = useState<AccountState | null>(null);

  useEffect(() => {
    fetch('/api/auth/customer')
      .then((r) => r.json())
      .then(setAccount)
      .catch(() => setAccount({ authenticated: false }));
  }, []);

  async function logout() {
    await fetch('/api/auth/customer/logout', { method: 'POST' });
    setAccount({ authenticated: false });
  }

  return (
    <div className="page-content max-w-2xl">
      <h1 className="text-3xl font-semibold">Mon compte</h1>
      <p className="mt-2 text-sm text-radar-muted">
        Retrouvez ici vos territoires débloqués et votre abonnement.
      </p>

      {!account && <p className="mt-8 text-radar-muted">Chargement…</p>}

      {account && !account.authenticated && (
        <div className="card mt-8 p-8 text-center">
          <p className="text-radar-muted">{COPY.accountNoAccess}</p>
          <p className="mt-2 text-sm text-radar-subtle">
            {COPY.accountAccessHint}
          </p>
          <Link href="/explorer" className="btn-secondary mt-6">
            {COPY.openExplorer}
          </Link>
          <Link href="/tarifs" className="btn-primary mt-3">
            Voir les tarifs
          </Link>
        </div>
      )}

      {account?.authenticated && (
        <div className="mt-8 space-y-6">
          <div className="card space-y-6 p-8">
            {account.pro && (
              <div className="flex items-center gap-2 text-radar-signal">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">{COPY.subscription} actif</span>
              </div>
            )}
            {account.email && (
              <p className="text-sm text-radar-muted">
                Email : <span className="font-medium text-radar-text">{account.email}</span>
              </p>
            )}
            {account.proUntil && (
              <p className="text-sm text-radar-muted">
                Abonnement valide jusqu&apos;au{' '}
                {new Date(account.proUntil).toLocaleDateString('fr-FR')}
              </p>
            )}
            {account.pro && (
              <Link href="/explorer" className="btn-primary">
                {COPY.openExplorer} (accès illimité)
              </Link>
            )}
            {account.packs && account.packs.length > 0 && (
              <div>
                <p className="text-sm font-semibold">Territoires débloqués</p>
                <ul className="mt-3 space-y-2">
                  {account.packs.map((p) => (
                    <li key={p.packId} className="flex items-center justify-between rounded-lg border border-radar-border px-4 py-3">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-radar-muted">
                          {p.department}
                          {p.capex ? ` · ${formatEur(p.capex, true)}` : ''}
                        </p>
                      </div>
                      <Link href={`/explorer/${p.packId}`} className="text-sm font-medium text-radar-signal hover:underline">
                        Ouvrir →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-3 border-t border-radar-border pt-6">
              <Link href="/explorer" className="btn-secondary">
                {COPY.backToExplorer}
              </Link>
              <button type="button" onClick={logout} className="btn-ghost text-sm">
                <LogOut className="h-4 w-4" />
                Réinitialiser cet appareil
              </button>
            </div>
          </div>

          <AlertPreferencesPanel />
        </div>
      )}
    </div>
  );
}
