'use client';

import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  PACK_PIPELINE_COLUMNS,
  PACK_PIPELINE_STATUSES,
  nextPipelineStatus,
  pipelineColumnLabel,
  type PackPipelineStatus,
} from '@/lib/pipeline-crm';
import { cn } from '@/lib/utils';

export function DossierPackPipeline({ packId }: { packId: string }) {
  const [status, setStatus] = useState<PackPipelineStatus>('new');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/pipeline');
      if (!res.ok) throw new Error('Chargement impossible');
      const data = (await res.json()) as {
        territories: { packId: string; pipelineStatus: PackPipelineStatus }[];
      };
      const card = data.territories.find((t) => t.packId === packId);
      setStatus(card?.pipelineStatus ?? 'new');
    } catch {
      setError('Pipeline indisponible.');
    } finally {
      setLoading(false);
    }
  }, [packId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(next: PackPipelineStatus) {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch('/api/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, status: next }),
      });
      if (!res.ok) throw new Error('Mise à jour refusée');
      setStatus(next);
    } catch {
      setError('Échec de la mise à jour.');
    } finally {
      setUpdating(false);
    }
  }

  const next = nextPipelineStatus(status);
  const column = PACK_PIPELINE_COLUMNS.find((c) => c.id === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement pipeline…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-900">Statut CRM — ce territoire</p>
      <p className="mt-0.5 text-[11px] text-slate-500">
        Mettez à jour sans quitter le dossier
      </p>

      {error && (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
          {error}
        </p>
      )}

      {/* Stepper visuel */}
      <div className="mt-4 flex flex-wrap gap-1">
        {PACK_PIPELINE_COLUMNS.map((col) => (
          <button
            key={col.id}
            type="button"
            disabled={updating}
            onClick={() => void updateStatus(col.id)}
            className={cn(
              'rounded-md border px-2 py-1 text-[10px] font-medium transition-colors',
              status === col.id
                ? cn(col.headerClass, 'border-2 font-bold')
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-white',
            )}
          >
            {col.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={status}
          disabled={updating}
          onChange={(e) => void updateStatus(e.target.value as PackPipelineStatus)}
          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs"
          aria-label="Statut pipeline"
        >
          {PACK_PIPELINE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {pipelineColumnLabel(s)}
            </option>
          ))}
        </select>

        {next && (
          <button
            type="button"
            disabled={updating}
            onClick={() => void updateStatus(next)}
            className="btn-secondary !py-1.5 !text-xs"
          >
            Avancer → {pipelineColumnLabel(next)}
          </button>
        )}
      </div>

      {column && (
        <p className="mt-3 text-[11px] text-slate-500">{column.hint}</p>
      )}
    </div>
  );
}
