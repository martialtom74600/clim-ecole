'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, Gift } from 'lucide-react';
import { COPY } from '@/lib/copy';

export default function ParrainagePage() {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    fetch('/api/auth/customer')
      .then((r) => r.json())
      .then((a) => {
        setAuth(Boolean(a.authenticated));
        if (a.authenticated) {
          return fetch('/api/account/preferences').then((r) => (r.ok ? r.json() : null));
        }
        return null;
      })
      .then((prefs) => {
        if (prefs?.referralCode) setCode(prefs.referralCode);
      })
      .catch(() => undefined);
  }, []);

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page-content">
      <div className="flex items-center gap-2">
        <Gift className="h-6 w-6 text-radar-signal" />
        <h1 className="text-3xl font-semibold">Programme parrainage</h1>
      </div>
      <p className="mt-2 text-sm text-radar-muted">
        Partagez Clim École avec un collègue BTP, BE ou AMO. Chaque filleul bénéficie d&apos;un mois
        d&apos;essai Pro offert.
      </p>

      {!auth && (
        <div className="card mt-8 p-6 text-center">
          <p className="text-radar-muted">{COPY.accountNoAccess}</p>
          <Link href="/compte" className="btn-primary mt-4">
            Se connecter
          </Link>
        </div>
      )}

      {auth && (
        <div className="card mt-8 space-y-4 p-6">
          <p className="text-sm font-medium">Votre code parrain</p>
          {code ? (
            <div className="flex items-center gap-3">
              <code className="rounded-lg bg-radar-canvas px-4 py-2 text-lg font-bold tracking-wide">
                {code}
              </code>
              <button type="button" onClick={copyCode} className="btn-secondary !py-2">
                <Copy className="h-4 w-4" />
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-radar-muted">Génération du code…</p>
          )}
          <p className="text-xs text-radar-subtle">
            Le filleul entre ce code lors de son premier achat. Récompense créditée sous 48 h.
          </p>
        </div>
      )}
    </div>
  );
}
