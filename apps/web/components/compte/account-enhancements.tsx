'use client';

import { useEffect, useState } from 'react';
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
      <p className="text-[10px] font-medium uppercase tracking-wide text-radar-subtle">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${accent ? 'text-emerald-600' : ''}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-radar-muted">{hint}</p>}
    </div>
  );
}

export function MagicLinkLoginForm() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      setMsg(data.message ?? data.error ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <p className="text-sm font-semibold">Connexion multi-appareils</p>
      <p className="text-xs text-radar-muted">Recevez un lien magique par email (15 min).</p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="vous@entreprise.fr"
        className="input-field"
        required
      />
      <button type="submit" disabled={loading} className="btn-secondary w-full text-sm">
        {loading ? 'Envoi…' : 'Envoyer le lien'}
      </button>
      {msg && <p className="text-xs text-radar-muted">{msg}</p>}
    </form>
  );
}
