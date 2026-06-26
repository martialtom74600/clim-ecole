'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Download, Mail, Star } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { trackEvent } from '@/lib/track';

function SuccessInner() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [packId, setPackId] = useState<string | null>(null);
  const [plan, setPlan] = useState<'dossier' | 'pro' | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }
    fetch(`/api/stripe/complete?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('fail');
        const data = (await r.json()) as {
          redirect?: string;
          packId?: string | null;
          plan?: 'dossier' | 'pro';
        };
        setStatus('ok');
        setPackId(data.packId ?? null);
        setPlan(data.plan ?? null);
        trackEvent('purchase_complete', { plan: data.plan ?? 'dossier' });
      })
      .catch(() => setStatus('error'));
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="page-content flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold">Confirmation du paiement…</p>
        <p className="mt-2 text-radar-muted">Activation de votre accès</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="page-content flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold">Erreur de confirmation</p>
        <p className="mt-2 text-sm text-radar-muted">Contactez-nous si le paiement a bien été débité.</p>
        <Link href="/compte" className="btn-primary mt-6">
          Mon compte
        </Link>
      </div>
    );
  }

  return (
    <div className="page-content max-w-xl py-16">
      <div className="card p-8 text-center md:p-10">
        <CheckCircle2 className="mx-auto h-12 w-12 text-radar-signal" />
        <h1 className="mt-4 text-2xl font-semibold">Paiement confirmé</h1>
        <p className="mt-2 text-radar-muted">
          {plan === 'pro'
            ? `Votre ${COPY.subscription.toLowerCase()} est actif. Tous les territoires sont débloqués.`
            : 'Votre territoire est débloqué. Noms, écoles et contacts sont visibles.'}
        </p>

        <ol className="mt-8 space-y-3 text-left text-sm">
          <li className="flex items-start gap-3 rounded-lg bg-radar-canvas p-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-radar-signal" />
            Contactez les mairies via les emails du dossier
          </li>
          <li className="flex items-start gap-3 rounded-lg bg-radar-canvas p-3">
            <Download className="mt-0.5 h-4 w-4 shrink-0 text-radar-signal" />
            Exportez le CSV ou le PDF depuis la fiche territoire
          </li>
          <li className="flex items-start gap-3 rounded-lg bg-radar-canvas p-3">
            <Star className="mt-0.5 h-4 w-4 shrink-0 text-radar-signal" />
            Ajoutez le territoire à vos favoris pour le retrouver
          </li>
        </ol>

        {plan === 'dossier' && (
          <p className="mt-6 text-xs text-radar-subtle">
            Accès valable 30 jours pour ce territoire.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {packId ? (
            <Link href={`/explorer/${packId}`} className="btn-primary py-4">
              Ouvrir le territoire débloqué
            </Link>
          ) : (
            <Link href="/explorer" className="btn-primary py-4">
              {COPY.openExplorer}
            </Link>
          )}
          <Link href="/compte" className="btn-secondary">
            Mon compte
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
