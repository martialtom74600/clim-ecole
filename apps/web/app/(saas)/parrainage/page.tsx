'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { PAGE_VERDICTS } from '@/lib/site-narrative';
import { NarrativeSection, NarrativeVerdict } from '@/components/layout/narrative-page';

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

  const { label, headline, subline } = PAGE_VERDICTS.parrainage;

  return (
    <div>
      <NarrativeVerdict label={label} headline={headline} subline={subline} />

      <div className="page-content !pt-0">
        {!auth && (
          <div className="card p-6 text-center">
            <p className="text-ink-muted">{COPY.accountNoAccess}</p>
            <Link href="/compte" className="btn-primary mt-4">
              Se connecter
            </Link>
          </div>
        )}

        {auth && (
          <NarrativeSection
            title="Votre code parrain"
            description="Le filleul entre ce code lors de son premier achat. Récompense créditée sous 48 h."
            bordered={false}
            className="!px-0 !py-0"
          >
            <div className="card space-y-4 p-6">
              {code ? (
                <div className="flex items-center gap-3">
                  <code className="rounded-lg bg-surface-sunken px-4 py-2 text-lg font-bold tracking-wide">
                    {code}
                  </code>
                  <button type="button" onClick={copyCode} className="btn-secondary !py-2">
                    <Copy className="h-4 w-4" />
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-ink-muted">Génération du code…</p>
              )}
            </div>
          </NarrativeSection>
        )}
      </div>
    </div>
  );
}
