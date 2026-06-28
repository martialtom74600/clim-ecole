'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Kanban, LogOut } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { AlertPreferencesPanel } from '@/components/marketplace/alert-preferences';
import { PipelineKanbanBoard } from '@/components/compte/pipeline-kanban';

interface AccountState {
  authenticated: boolean;
  email?: string;
  pro?: boolean;
  proUntil?: string | null;
  packCount?: number;
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
    <div className="page-content max-w-[1400px]">
      <h1 className="text-3xl font-semibold">Mon compte</h1>
      <p className="mt-2 text-sm text-radar-muted">
        Pipeline de prospection, territoires débloqués et abonnement.
      </p>

      {!account && <p className="mt-8 text-radar-muted">Chargement…</p>}

      {account && !account.authenticated && (
        <div className="card mt-8 p-8 text-center">
          <p className="text-radar-muted">{COPY.accountNoAccess}</p>
          <p className="mt-2 text-sm text-radar-subtle">{COPY.accountAccessHint}</p>
          <Link href="/explorer" className="btn-secondary mt-6">
            {COPY.openExplorer}
          </Link>
          <Link href="/tarifs" className="btn-primary mt-3">
            Voir les tarifs
          </Link>
        </div>
      )}

      {account?.authenticated && (
        <div className="mt-8 space-y-8">
          <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              {account.pro && (
                <div className="mb-2 flex items-center gap-2 text-radar-signal">
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
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/explorer" className="btn-secondary">
                {COPY.openExplorer}
              </Link>
              <button type="button" onClick={logout} className="btn-ghost text-sm">
                <LogOut className="h-4 w-4" />
                Réinitialiser cet appareil
              </button>
            </div>
          </div>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Kanban className="h-5 w-5 text-radar-signal" />
              <h2 className="text-xl font-semibold">Pipeline commercial</h2>
            </div>
            <p className="mb-6 text-sm text-radar-muted">
              Faites avancer vos territoires débloqués dans votre tunnel de vente. Un clic pour
              mettre à jour le statut — synchronisé en temps réel.
            </p>
            <PipelineKanbanBoard />
          </section>

          <AlertPreferencesPanel />
        </div>
      )}
    </div>
  );
}
