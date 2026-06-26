'use client';

import { useState } from 'react';
import { Calendar, StickyNote, X } from 'lucide-react';
import type { PipelineCard } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';

interface PipelineCardEditorProps {
  card: PipelineCard;
  onClose: () => void;
  onSave: (patch: { note?: string; followUpDate?: string | null }) => Promise<void>;
}

export function PipelineCardEditor({ card, onClose, onSave }: PipelineCardEditorProps) {
  const [note, setNote] = useState(card.note ?? '');
  const [followUpDate, setFollowUpDate] = useState(card.followUpDate?.slice(0, 10) ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        note,
        followUpDate: followUpDate || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} labelledBy="pipeline-editor-title">
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id="pipeline-editor-title" className="text-lg font-semibold text-zinc-50">
              {card.title}
            </h2>
            <p className="text-sm text-zen-muted">{card.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-4 block">
          <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
            <StickyNote className="h-4 w-4 text-zen-teal" />
            Note de suivi
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Ex : Appel DGS le 12/06, relancer après conseil municipal…"
            className="input-field resize-none"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Calendar className="h-4 w-4 text-zen-teal" />
            Date de relance
          </span>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="input-field"
          />
        </label>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm text-zen-muted transition-colors hover:text-zinc-200"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'flex-1 rounded-xl bg-zen-teal py-2.5 text-sm font-semibold text-zen-bg transition-opacity hover:opacity-90',
              saving && 'opacity-60',
            )}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function formatFollowUpLabel(date?: string): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(
    new Date(date),
  );
}

export function FollowUpBadge({
  followUpDate,
  className,
}: {
  followUpDate?: string;
  className?: string;
}) {
  if (!followUpDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(followUpDate);
  const overdue = d < today;
  const isToday = followUpDate.slice(0, 10) === today.toISOString().slice(0, 10);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium',
        overdue && 'bg-red-500/15 text-red-400',
        isToday && !overdue && 'bg-amber-500/15 text-amber-300',
        !overdue && !isToday && 'bg-white/5 text-zen-muted',
        className,
      )}
    >
      <Calendar className="h-3 w-3" />
      {overdue ? 'En retard · ' : isToday ? 'Aujourd’hui · ' : ''}
      {formatFollowUpLabel(followUpDate)}
    </span>
  );
}
