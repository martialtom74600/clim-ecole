'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Laptop, Loader2, X } from 'lucide-react';
import { useAccountPreferences } from '@/hooks/use-account-preferences';

const DISMISS_KEY = 'clim-sync-nudge-dismissed';
const THRESHOLD = 3;

/**
 * Capture email au "moment de valeur" : dès qu'un visiteur anonyme suit assez de
 * territoires pour craindre de les perdre, on lui propose de les sauvegarder
 * (magic-link). Non-intrusif, dismissable, et silencieux une fois connecté.
 */
export function SyncNudge() {
  const { prefs, authenticated, loaded } = useAccountPreferences();
  const [dismissed, setDismissed] = useState(true);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus('done');
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      setStatus('idle');
    }
  }

  const visible =
    loaded && !authenticated && !dismissed && prefs.watchlist.length >= THRESHOLD;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 right-4 z-[90] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-4 shadow-overlay"
          role="dialog"
          aria-label="Sauvegarder votre sélection"
        >
          <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 text-ink-subtle transition-colors hover:text-ink"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>

      {status === 'done' ? (
        <div className="flex items-center gap-3 pr-6">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-positive-soft text-positive-text">
            <Check className="h-5 w-5" />
          </span>
          <p className="text-sm text-ink">
            Lien envoyé — ouvrez-le pour retrouver vos {prefs.watchlist.length} territoires partout.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 pr-6">
            <Laptop className="h-4 w-4 text-ink" />
            <p className="text-sm font-semibold text-ink">Sauvegardez votre sélection</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Vous suivez {prefs.watchlist.length} territoires. Recevez un lien pour les retrouver sur
            tous vos appareils — sans mot de passe.
          </p>
          <form onSubmit={submit} className="mt-3 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.fr"
              className="input-field flex-1 !py-2 text-sm"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-primary shrink-0 !py-2 !text-sm"
            >
              {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recevoir'}
            </button>
          </form>
        </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
