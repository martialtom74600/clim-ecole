'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Download, Mail, Star } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { PAGE_VERDICTS } from '@/lib/site-narrative';
import { trackEvent } from '@/lib/track';
import { NarrativeVerdict } from '@/components/layout/narrative-page';

function SuccessInner() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  const [status, setStatus] = useState<'loading' | 'pending' | 'ok' | 'error'>('loading');
  const [packId, setPackId] = useState<string | null>(null);
  const [plan, setPlan] = useState<'dossier' | 'pro' | null>(null);

  const confirm = useCallback(async () => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const r = await fetch(`/api/stripe/complete?session_id=${encodeURIComponent(sessionId)}`);
    const data = (await r.json()) as {
      redirect?: string;
      packId?: string | null;
      plan?: 'dossier' | 'pro';
      code?: string;
    };

    if (r.status === 202 || data.code === 'activation_pending') {
      setStatus('pending');
      setPackId(data.packId ?? null);
      setPlan(data.plan ?? null);
      return;
    }

    if (!r.ok) {
      setStatus('error');
      return;
    }

    setStatus('ok');
    setPackId(data.packId ?? null);
    setPlan(data.plan ?? null);
    trackEvent('purchase_complete', { plan: data.plan ?? 'dossier' });
  }, [sessionId]);

  useEffect(() => {
    confirm();
  }, [confirm]);

  useEffect(() => {
    if (status !== 'pending') return;
    const t = setInterval(() => {
      confirm();
    }, 2000);
    return () => clearInterval(t);
  }, [status, confirm]);

  if (status === 'loading' || status === 'pending') {
    return (
      <div className="page-content flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold">Confirmation du paiement…</p>
        <p className="mt-2 text-ink-muted">
          {status === 'pending'
            ? 'Activation de votre accès en cours (quelques secondes)'
            : 'Vérification du paiement'}
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="page-content flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold">Erreur de confirmation</p>
        <p className="mt-2 text-sm text-ink-muted">
          Si le paiement a été débité, consultez Mon compte dans quelques instants ou contactez le support.
        </p>
        <Link href="/compte" className="btn-primary mt-6">
          Mon compte
        </Link>
      </div>
    );
  }

  const { label, headline, subline } = PAGE_VERDICTS.success;

  return (
    <div>
      <NarrativeVerdict label={label} headline={headline} subline={subline}>
        <CheckCircle2 className="mt-4 h-10 w-10 text-positive" />
        <p className="mt-3 text-sm text-ink-muted">
          {plan === 'pro'
            ? `Votre ${COPY.subscription.toLowerCase()} est actif — tous les territoires débloqués.`
            : 'Montants exacts, écoles et contacts mairies visibles.'}
          {plan === 'dossier' && (
            <span className="mt-1 block text-xs text-ink-subtle">Accès valable 30 jours pour ce territoire.</span>
          )}
        </p>
      </NarrativeVerdict>

      <div className="page-content !pt-0">
        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-3 rounded-lg border border-line bg-white p-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">1</span>
            <div>
              <p className="font-semibold text-ink">Contactez les mairies</p>
              <p className="mt-0.5 text-ink-muted">Emails et téléphones dans l&apos;onglet Terrain du dossier.</p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-line bg-white p-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">2</span>
            <div>
              <p className="font-semibold text-ink">Exportez votre pitch</p>
              <p className="mt-0.5 text-ink-muted">Pitch maire, CSV CRM ou note technique — section Action.</p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-line bg-white p-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">3</span>
            <div>
              <p className="font-semibold text-ink">Suivez dans le pipeline</p>
              <p className="mt-0.5 text-ink-muted">Contacté → RDV → Gagné dans Mon compte.</p>
            </div>
          </li>
        </ol>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {packId ? (
            <Link href={`/explorer/${packId}#terrain`} className="btn-primary flex-1 justify-center py-3">
              <Mail className="h-4 w-4" />
              Ouvrir le dossier — Terrain
            </Link>
          ) : (
            <Link href="/explorer" className="btn-primary flex-1 justify-center py-3">
              {COPY.openExplorer}
            </Link>
          )}
          {packId && (
            <Link href={`/explorer/${packId}?section=action`} className="btn-secondary flex-1 justify-center py-3">
              <Download className="h-4 w-4" />
              Exports & documents
            </Link>
          )}
          <Link href="/compte" className="btn-ghost flex-1 justify-center py-3">
            <Star className="h-4 w-4" />
            Mon compte
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
