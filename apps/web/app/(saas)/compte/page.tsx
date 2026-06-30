'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ExternalLink, Kanban, LogOut } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { AlertPreferencesPanel } from '@/components/marketplace/alert-preferences';
import { GuidedSteps } from '@/components/marketplace/guided-steps';
import { COMPTE_PIPELINE_GUIDE } from '@/lib/site-guide';
import { PipelineKanbanBoard } from '@/components/compte/pipeline-kanban';
import {
  MagicLinkLoginForm,
  PipelineStatsLoader,
} from '@/components/compte/account-enhancements';
import { PageHeader } from '@/components/layout/page-header';

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
    <div className="page-content">
      {/* En-tête — structure spatiale standardisée */}
      <PageHeader
        title="Mon compte"
        subtitle="Pipeline de prospection, territoires débloqués et abonnement."
        actions={
          account?.authenticated ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/explorer" className="btn-secondary">
                <ExternalLink className="h-4 w-4" />
                {COPY.openExplorer}
              </Link>
              <Link href="/parrainage" className="btn-ghost text-sm">
                Parrainage
              </Link>
              <button type="button" onClick={logout} className="btn-ghost text-sm">
                <LogOut className="h-4 w-4" />
                Réinitialiser cet appareil
              </button>
            </div>
          ) : undefined
        }
      />

      {!account && (
        <p className="text-ink-muted">Chargement…</p>
      )}

      {account && !account.authenticated && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-8 text-center">
            <p className="text-ink-muted">{COPY.accountNoAccess}</p>
            <p className="mt-2 text-sm text-ink-subtle">{COPY.accountAccessHint}</p>
            <Link href="/explorer" className="btn-secondary mt-6">
              {COPY.openExplorer}
            </Link>
            <Link href="/tarifs" className="btn-primary mt-3">
              Voir les tarifs
            </Link>
          </div>
          <MagicLinkLoginForm />
        </div>
      )}

      {account?.authenticated && (
        <div className="space-y-12">
          {/* Statut de l'abonnement */}
          {(account.pro || account.email) && (
            <div className="card flex flex-wrap items-center gap-4 p-6 transition-all duration-300 ease-out hover:shadow-raised">
              <div className="flex-1">
                {account.pro && (
                  <div className="mb-2 inline-flex items-center gap-2 text-positive-text">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">{COPY.subscription} actif</span>
                  </div>
                )}
                {account.email && (
                  <p className="text-sm text-ink-muted">
                    Email :{' '}
                    <span className="font-medium text-ink">{account.email}</span>
                  </p>
                )}
                {account.proUntil && (
                  <p className="mt-1 text-sm text-ink-muted">
                    Abonnement valide jusqu&apos;au{' '}
                    <span className="font-medium text-ink">
                      {new Date(account.proUntil).toLocaleDateString('fr-FR')}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pipeline commercial */}
          <section className="space-y-6">
            <div className="border-b border-line pb-6">
              <div className="flex items-center gap-2">
                <Kanban className="h-5 w-5 text-ink" />
                <h2 className="text-xl font-semibold tracking-tight text-ink">Pipeline commercial</h2>
              </div>
              <p className="mt-1.5 text-sm text-ink-muted">
                Faites avancer vos territoires débloqués dans votre tunnel de vente. Un clic pour
                mettre à jour le statut — synchronisé en temps réel.
              </p>
            </div>
            <GuidedSteps
              title="Comment utiliser le pipeline"
              steps={COMPTE_PIPELINE_GUIDE}
            />
            <PipelineStatsLoader />
            <PipelineKanbanBoard />
          </section>

          <AlertPreferencesPanel />
        </div>
      )}
    </div>
  );
}
