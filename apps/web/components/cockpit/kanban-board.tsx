'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatEur } from '@/lib/format';
import { TemperatureBadge } from '@/components/cockpit/badges';
import {
  FollowUpBadge,
  PipelineCardEditor,
} from '@/components/cockpit/pipeline-card-editor';
import { useToast } from '@/components/ui/toast';
import type { PipelineCard, PipelineStage } from '@/lib/types';
import { PIPELINE_STAGES } from '@/lib/types';
import { Building2, ChevronDown, GraduationCap, GripVertical, Pencil } from 'lucide-react';

export function KanbanBoard({ initialCards }: { initialCards: PipelineCard[] }) {
  const [cards, setCards] = useState(initialCards);
  const [dragging, setDragging] = useState<string | null>(null);
  const [editing, setEditing] = useState<PipelineCard | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  async function patchCard(
    id: string,
    payload: { stage: PipelineStage; note?: string; followUpDate?: string | null },
    prevCards: PipelineCard[],
  ) {
    setSaving(id);
    try {
      const res = await fetch('/api/admin/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!res.ok) throw new Error('patch failed');
      router.refresh();
      return true;
    } catch {
      setCards(prevCards);
      toast('Échec de la sauvegarde — réessayez', 'error');
      return false;
    } finally {
      setSaving(null);
    }
  }

  async function moveCard(id: string, stage: PipelineStage) {
    const card = cards.find((c) => c.id === id);
    if (!card || card.stage === stage) return;

    const prev = cards;
    setCards((p) => p.map((c) => (c.id === id ? { ...c, stage } : c)));

    const ok = await patchCard(
      id,
      { stage, note: card.note, followUpDate: card.followUpDate ?? null },
      prev,
    );
    if (ok) toast('Étape mise à jour');
  }

  async function saveCardMeta(
    id: string,
    patch: { note?: string; followUpDate?: string | null },
  ) {
    const card = cards.find((c) => c.id === id);
    if (!card) return;

    const prev = cards;
    setCards((p) =>
      p.map((c) =>
        c.id === id
          ? { ...c, note: patch.note, followUpDate: patch.followUpDate ?? undefined }
          : c,
      ),
    );

    const ok = await patchCard(
      id,
      { stage: card.stage, note: patch.note, followUpDate: patch.followUpDate },
      prev,
    );
    if (ok) toast('Note enregistrée');
  }

  return (
    <>
      {editing && (
        <PipelineCardEditor
          card={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => saveCardMeta(editing.id, patch)}
        />
      )}

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-6 md:gap-5">
        {PIPELINE_STAGES.map((col) => {
          const colCards = cards.filter((c) => c.stage === col.id);
          return (
            <div
              key={col.id}
              className={cn(
                'flex w-[min(85vw,20rem)] shrink-0 snap-start flex-col rounded-2xl border border-line bg-zen-panel/80 border-t-[3px] md:w-80',
                col.color,
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                if (id) moveCard(id, col.id);
                setDragging(null);
              }}
            >
              <header className="border-b border-line px-4 py-4 md:px-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">{col.label}</h3>
                    <p className="mt-1 text-sm leading-snug text-ink-muted">{col.hint}</p>
                  </div>
                  <span className="rounded-lg bg-zen-elevated px-2.5 py-1 text-sm tabular-nums text-zen-muted">
                    {colCards.length}
                  </span>
                </div>
              </header>

              <div className="flex min-h-[140px] flex-1 flex-col gap-3 p-3">
                {colCards.map((card) => (
                  <div
                    key={card.id}
                    draggable={!saving}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', card.id);
                      setDragging(card.id);
                    }}
                    onDragEnd={() => setDragging(null)}
                    className={cn(
                      'group rounded-xl border border-line bg-zen-elevated p-4 transition-all duration-200 hover:border-line-strong hover:bg-zen-hover',
                      dragging === card.id && 'opacity-50',
                      saving === card.id && 'opacity-70',
                    )}
                  >
                    <div className="mb-3 flex items-start gap-2">
                      <GripVertical className="mt-1 hidden h-4 w-4 shrink-0 cursor-grab text-ink-subtle active:cursor-grabbing md:block" />
                      <div className="min-w-0 flex-1">
                        <Link href={card.href} className="block">
                          <p className="truncate text-[15px] font-medium text-ink group-hover:text-zen-teal">
                            {card.title}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-zen-muted">{card.subtitle}</p>
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditing(card)}
                        className="touch-visible shrink-0 rounded-lg p-1.5 text-ink-muted opacity-70 transition-all hover:bg-surface-sunken hover:text-zen-teal md:opacity-0 md:group-hover:opacity-100"
                        title="Note et relance"
                        aria-label="Modifier note et relance"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {card.type === 'epci' ? (
                        <Building2 className="h-4 w-4 shrink-0 text-zen-teal/70" />
                      ) : (
                        <GraduationCap className="h-4 w-4 shrink-0 text-ink-subtle" />
                      )}
                    </div>

                    {(card.note || card.followUpDate) && (
                      <div className="mb-3 space-y-1.5 border-t border-line pt-3">
                        {card.note && (
                          <p className="line-clamp-2 text-xs leading-relaxed text-ink-muted">
                            {card.note}
                          </p>
                        )}
                        <FollowUpBadge followUpDate={card.followUpDate} />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-semibold tabular-nums text-ink">
                        {formatEur(card.capex, true)}
                      </p>
                      <TemperatureBadge
                        label={card.temperature}
                        level={card.temperatureLevel}
                        className="max-w-[90px] truncate text-xs"
                      />
                    </div>

                    <label className="mt-3 flex items-center gap-2 md:hidden">
                      <span className="text-xs text-ink-muted">Étape</span>
                      <div className="relative min-w-0 flex-1">
                        <select
                          value={card.stage}
                          onChange={(e) => moveCard(card.id, e.target.value as PipelineStage)}
                          className="w-full appearance-none rounded-lg border border-line bg-zen-bg py-1.5 pl-2 pr-7 text-xs text-ink-soft outline-none focus:border-zen-teal/40"
                        >
                          {PIPELINE_STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-subtle" />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
