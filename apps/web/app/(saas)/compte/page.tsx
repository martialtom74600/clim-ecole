'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ExternalLink, Kanban, LogOut } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { PAGE_VERDICTS } from '@/lib/site-narrative';
import { AlertPreferencesPanel } from '@/components/marketplace/alert-preferences';
import { GuidedSteps } from '@/components/marketplace/guided-steps';
import { COMPTE_PIPELINE_GUIDE } from '@/lib/site-guide';
import { PipelineKanbanBoard } from '@/components/compte/pipeline-kanban';
import {
  MagicLinkLoginForm,
  PipelineStatsLoader,
} from '@/components/compte/account-enhancements';
import { NarrativeVerdict } from '@/components/layout/narrative-page';

interface AccountState {
  authenticated: boolean;
  email?: string;
  pro?: boolean;
  proUntil?: string | null;
  packCount?: number;
}

export default function ComptePage() {
  const [account, setAccount] = useState<AccountState | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/customer')
      .then((r) => r.json())
      .then(setAccount)
      .catch(() => setAccount({ authenticated: false }));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('synced')) {
      setNotice({
        kind: 'success',
        text: 'Connecté — vos favoris, pipeline et territoires sont synchronisés sur cet appareil.',
      });
    } else if (params.get('error') === 'magic_expired') {
      setNotice({ kind: 'error', text: 'Lien de connexion expiré — demandez-en un nouveau.' });
    }
    if (params.has('synced') || params.has('error')) {
      window.history.replaceState(null, '', '/compte');
    }
  }, []);

  async function logout() {
    await fetch('/api/auth/customer/logout', { method: 'POST' });
    setAccount({ authenticated: false });
  }

  async function logoutAll() {
    await fetch('/api/auth/customer/logout-all', { method: 'POST' });
    setAccount({ authenticated: false });
  }

  const { label, headline, subline } = PAGE_VERDICTS.compte;

  return (
    <div>
      <NarrativeVerdict label={label} headline={headline} subline={subline}>
        {account?.authenticated && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/explorer" className="btn-secondary">
              <ExternalLink className="h-4 w-4" />
              {COPY.openExplorer}
            </Link>
            <Link href="/parrainage" className="btn-ghost text-sm">
              Parrainage
            </Link>
            <button type="button" onClick={logout} className="btn-ghost text-sm">
              <LogOut className="h-4 w-4" />
              Déconnecter cet appareil
            </button>
            <button
              type="button"
              onClick={logoutAll}
              className="btn-ghost text-sm text-ink-subtle"
              title="Invalide toutes les sessions ouvertes, sur tous vos appareils"
            >
              Tous les appareils
            </button>
          </div>
        )}
      </NarrativeVerdict>

      <div className="page-content !pt-0">
        {notice && (
          <div
            className={
              notice.kind === 'success'
                ? 'mb-6 flex items-center gap-2 rounded-xl border border-positive-border bg-positive-soft px-4 py-3 text-sm text-positive-text'
                : 'mb-6 flex items-center gap-2 rounded-xl border border-warning-border bg-warning-soft px-4 py-3 text-sm text-warning-text'
            }
          >
            {notice.kind === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {notice.text}
          </div>
        )}

        {!account && <p className="text-ink-muted">Chargement…</p>}

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
          <div className="space-y-10">
            {(account.pro || account.email) && (
              <div className="card flex flex-wrap items-center gap-4 p-6">
                <div className="flex-1">
                  {account.pro && (
                    <div className="mb-2 inline-flex items-center gap-2 text-positive-text">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">{COPY.subscription} actif</span>
                    </div>
                  )}
                  {account.email && (
                    <p className="text-sm text-ink-muted">
                      Email : <span className="font-medium text-ink">{account.email}</span>
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
                  {account.packCount != null && account.packCount > 0 && (
                    <p className="mt-1 text-sm text-ink-muted">
                      {account.packCount} territoire{account.packCount > 1 ? 's' : ''} débloqué
                      {account.packCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            <section id="pipeline">
              <div className="mb-6 flex items-center gap-2 border-b border-line pb-4">
                <Kanban className="h-5 w-5 text-ink" />
                <h2 className="text-lg font-semibold text-ink">Pipeline commercial</h2>
              </div>
              <p className="mb-6 text-sm text-ink-muted">
                Faites avancer vos territoires débloqués — Contacté → RDV → Gagné.
              </p>
              <GuidedSteps title="Comment utiliser le pipeline" steps={COMPTE_PIPELINE_GUIDE} />
              <div className="mt-6 space-y-6">
                <PipelineStatsLoader />
                <PipelineKanbanBoard />
              </div>
            </section>

            <section id="alertes" className="border-t border-line pt-10">
              <h2 className="text-base font-semibold text-ink">Alertes territoire</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Soyez prévenu quand un territoire correspond à vos critères.
              </p>
              <div className="mt-6">
                <AlertPreferencesPanel />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
