'use client';

import { useEffect, useState } from 'react';
import { Laptop, MailCheck, ShieldCheck } from 'lucide-react';
import type { PipelinePortfolioStats } from '@/lib/pipeline-crm';
import { formatEur } from '@/lib/format';
import { PACK_PIPELINE_COLUMNS } from '@/lib/pipeline-crm';

export function PipelineStatsDashboard({ stats }: { stats: PipelinePortfolioStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Territoires actifs" value={String(stats.total)} />
      <StatCard label="Taux conversion" value={`${stats.winRatePct} %`} hint="Gagné / (Gagné + Perdu)" />
      <StatCard label="CAPEX pipeline" value={formatEur(stats.capexPipeline, true)} />
      <StatCard label="CAPEX gagné" value={formatEur(stats.capexWon, true)} accent />
      <div className="card col-span-full p-4 sm:col-span-2 lg:col-span-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-radar-subtle">Répartition pipeline</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PACK_PIPELINE_COLUMNS.map((col) => (
            <span key={col.id} className={`rounded-full px-2.5 py-1 text-xs font-medium ${col.badgeClass}`}>
              {col.label} · {stats.byStatus[col.id]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PipelineStatsLoader() {
  const [stats, setStats] = useState<PipelinePortfolioStats | null>(null);

  useEffect(() => {
    fetch('/api/pipeline')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.stats) setStats(d.stats as PipelinePortfolioStats);
      })
      .catch(() => undefined);
  }, []);

  if (!stats?.total) return null;
  return <PipelineStatsDashboard stats={stats} />;
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${accent ? 'text-positive-text' : 'text-ink'}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-ink-muted">{hint}</p>}
    </div>
  );
}

export function MagicLinkLoginForm() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setDevLink(null);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        devLink?: string;
      };
      setSent(Boolean(data.ok));
      setMsg(data.message ?? data.error ?? 'Erreur');
      setDevLink(data.devLink ?? null);
    } catch {
      setMsg('Connexion interrompue — réessayez dans un instant.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-positive-soft text-positive-text">
          <MailCheck className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-ink">Vérifiez votre boîte mail</p>
        <p className="text-sm text-ink-muted">{msg}</p>
        {devLink && (
          <a
            href={devLink}
            className="break-all text-xs font-medium text-info-text underline underline-offset-2"
          >
            Lien de connexion (dev)
          </a>
        )}
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setMsg(null);
          }}
          className="btn-ghost mt-1 text-xs"
        >
          Utiliser une autre adresse
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-6">
      <div className="flex items-center gap-2">
        <Laptop className="h-4 w-4 text-ink" />
        <p className="text-sm font-semibold text-ink">Synchroniser sur tous mes appareils</p>
      </div>
      <p className="text-sm text-ink-muted">
        Recevez un lien magique par email. Vos favoris, votre pipeline et vos territoires débloqués
        vous suivent sur n&apos;importe quel ordinateur ou mobile — aucun mot de passe.
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="vous@entreprise.fr"
        className="input-field"
        required
      />
      <button type="submit" disabled={loading} className="btn-primary w-full text-sm">
        {loading ? 'Envoi…' : 'Recevoir mon lien de connexion'}
      </button>
      <p className="flex items-center gap-1.5 text-[11px] text-ink-subtle">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        Lien valable 15 minutes · aucun mot de passe à retenir
      </p>
      {msg && !sent && <p className="text-xs text-ink-muted">{msg}</p>}
    </form>
  );
}
