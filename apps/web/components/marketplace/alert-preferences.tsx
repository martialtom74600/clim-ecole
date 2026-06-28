'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, HardHat, Landmark, Leaf, Loader2, Ruler, Zap } from 'lucide-react';
import type { ClientPersona } from '@/lib/types';
import { PERSONA_FILTER_LABELS } from '@/lib/copy';
import { loadAlertPreferences, saveAlertPreferences } from '@/lib/radar-client-storage';
import { trackEvent } from '@/lib/track';
import { cn } from '@/lib/utils';

const PERSONA_OPTIONS: { id: ClientPersona; label: string; hint: string; icon: typeof HardHat }[] = [
  { id: 'btp', label: PERSONA_FILTER_LABELS.btp.short, hint: PERSONA_FILTER_LABELS.btp.long, icon: HardHat },
  { id: 'be', label: PERSONA_FILTER_LABELS.be.short, hint: PERSONA_FILTER_LABELS.be.long, icon: Ruler },
  { id: 'amo', label: PERSONA_FILTER_LABELS.amo.short, hint: PERSONA_FILTER_LABELS.amo.long, icon: Landmark },
  { id: 'esco', label: PERSONA_FILTER_LABELS.esco.short, hint: PERSONA_FILTER_LABELS.esco.long, icon: Zap },
  { id: 'cee', label: PERSONA_FILTER_LABELS.cee.short, hint: PERSONA_FILTER_LABELS.cee.long, icon: Leaf },
];

export function AlertPreferencesPanel() {
  const [minCapex, setMinCapex] = useState(400000);
  const [email, setEmail] = useState('');
  const [personas, setPersonas] = useState<ClientPersona[]>(['btp', 'be', 'amo', 'esco', 'cee']);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prefs = loadAlertPreferences();
    if (prefs) {
      setMinCapex(prefs.minCapex);
      setEmail(prefs.email);
      if (prefs.personas?.length) {
        setPersonas(prefs.personas.filter((p): p is ClientPersona =>
          ['btp', 'be', 'amo', 'esco', 'cee'].includes(p),
        ));
      }
    }

    fetch('/api/alerts')
      .then((r) => r.json())
      .then((data: { subscribed?: boolean; email?: string; minCapex?: number; personas?: ClientPersona[] }) => {
        if (data.subscribed && data.email) {
          setEmail(data.email);
          if (data.minCapex) setMinCapex(data.minCapex);
          if (data.personas?.length) setPersonas(data.personas);
        }
      })
      .catch(() => {});
  }, []);

  function togglePersona(id: ClientPersona) {
    setPersonas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function save() {
    if (!email.includes('@')) {
      setError('Email invalide');
      return;
    }
    if (personas.length === 0) {
      setError('Sélectionnez au moins un profil');
      return;
    }

    setLoading(true);
    setError(null);
    saveAlertPreferences({ minCapex, personas, email });

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, minCapex, personas }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de l\'enregistrement');
        return;
      }
      setSaved(true);
      trackEvent('alert_subscribe', { minCapex, personas: personas.join(',') });
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Connexion impossible — préférences sauvées localement');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-radar-muted" />
        <p className="text-xs font-semibold uppercase tracking-wide text-radar-subtle">Alertes email</p>
      </div>
      <h2 className="mt-2 font-semibold">Être prévenu des nouveaux territoires</h2>
      <p className="mt-1 text-sm text-radar-muted">
        Recevez un email quand un territoire correspond à votre budget minimum et votre métier.
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <span className="text-sm text-radar-muted">Votre métier</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {PERSONA_OPTIONS.map(({ id, label, hint, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={hint}
                onClick={() => togglePersona(id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  personas.includes(id)
                    ? 'border-radar-text bg-radar-text text-white'
                    : 'border-radar-border text-radar-muted hover:border-radar-subtle',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-sm">
          <span className="text-radar-muted">Budget travaux minimum</span>
          <input
            type="number"
            className="input-field mt-1"
            value={minCapex}
            step={50000}
            onChange={(e) => setMinCapex(Number(e.target.value))}
          />
          <span className="mt-1 block text-xs text-radar-subtle">En euros — ex. 400 000 pour les dossiers &gt; 400 k€</span>
        </label>
        <label className="block text-sm">
          <span className="text-radar-muted">Votre email</span>
          <input
            type="email"
            className="input-field mt-1"
            placeholder="commercial@votre-entreprise.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-amber-700">{error}</p>}
        <button type="button" onClick={save} disabled={loading} className="btn-secondary text-sm">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Alertes activées
            </>
          ) : (
            'Activer les alertes'
          )}
        </button>
      </div>
    </div>
  );
}
