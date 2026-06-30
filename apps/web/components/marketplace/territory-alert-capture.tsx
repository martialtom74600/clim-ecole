'use client';

import { useState, type FormEvent } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import type { ClientPersona } from '@/lib/brand';
import type { MarketplacePack } from '@/lib/types';
import { saveAlertPreferences } from '@/lib/radar-client-storage';
import { trackEvent } from '@/lib/track';
import { cn } from '@/lib/utils';

const DEFAULT_PERSONAS: ClientPersona[] = ['btp', 'be', 'amo', 'esco', 'cee'];

/**
 * Capture email anti-fuite : un visiteur qui ne convertit pas repart au moins
 * avec une raison de revenir. S'appuie sur le système d'alertes existant
 * (`/api/alerts`), pré-rempli avec le métier du territoire consulté.
 */
export function TerritoryAlertCapture({
  pack,
  className,
}: {
  pack: MarketplacePack;
  className?: string;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const personas = pack.personas?.length ? pack.personas : DEFAULT_PERSONAS;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Adresse email invalide');
      return;
    }
    setStatus('loading');
    setError(null);
    const minCapex = 400_000;
    saveAlertPreferences({ minCapex, personas, email });
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, minCapex, personas }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Enregistrement impossible');
        setStatus('idle');
        return;
      }
      trackEvent('alert_subscribe', { source: 'paywall', personas: personas.join(',') });
      setStatus('done');
    } catch {
      setError('Connexion impossible — réessayez');
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return (
      <div
        className={cn(
          'flex items-start gap-2.5 rounded-xl border border-positive-border bg-positive-soft p-4',
          className,
        )}
      >
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive-text" />
        <p className="text-sm text-positive-text">
          C&apos;est noté — vous serez prévenu dès qu&apos;un nouveau territoire{' '}
          {pack.department ? `(${pack.department}) ` : ''}correspond à votre activité.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn('rounded-xl border border-line bg-white p-4', className)}>
      <div className="flex items-center gap-2 text-ink">
        <Bell className="h-4 w-4 text-ink-muted" strokeWidth={1.5} />
        <p className="text-sm font-semibold">Pas encore prêt&nbsp;?</p>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
        Recevez un email à chaque nouveau territoire correspondant à votre métier — sans engagement.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="commercial@votre-entreprise.fr"
          className="w-full rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm outline-none transition-colors focus:border-ink focus:bg-white"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-secondary shrink-0 justify-center py-2"
        >
          {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Me prévenir'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-heat-text">{error}</p>}
    </form>
  );
}
