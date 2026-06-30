'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import type { MarketplaceBuilding } from '@/lib/types';
import type { ClientPersona } from '@/lib/brand';
import { buildMairieEmail } from '@/lib/mairie-email';
import { useToast } from '@/components/ui/toast';

export function MairieEmailButton({
  building,
  territoryName,
  packCapexTotal,
  gainNetMairieTotal,
  persona,
}: {
  building: MarketplaceBuilding;
  territoryName: string;
  packCapexTotal: number;
  gainNetMairieTotal: number;
  persona: ClientPersona;
}) {
  if (!building.emailMairie) return null;

  const { mailto } = buildMairieEmail({
    building,
    territoryName,
    packCapexTotal,
    gainNetMairieTotal,
    persona,
  });

  return (
    <a
      href={mailto}
      className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-1 text-[11px] font-medium text-ink-soft hover:bg-surface-muted"
    >
      <Mail className="h-3 w-3" />
      Email mairie
    </a>
  );
}

export function BlacklistBuildingButton({
  codeUai,
  blacklisted,
  onToggle,
}: {
  codeUai?: string;
  blacklisted: boolean;
  onToggle: () => void;
}) {
  if (!codeUai) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`text-[10px] font-medium ${blacklisted ? 'text-heat' : 'text-ink-subtle hover:text-ink'}`}
    >
      {blacklisted ? 'Écarté ✓' : 'Écarter'}
    </button>
  );
}

export function DossierShareButton({ packId }: { packId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function createShare() {
    setLoading(true);
    try {
      const res = await fetch(`/api/share/${packId}`, { method: 'POST' });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        setUrl(data.url);
        await navigator.clipboard.writeText(data.url);
        toast('Lien de partage copié — valable 7 jours', 'success');
      } else {
        toast(data.error ?? 'Impossible de générer le lien de partage', 'error');
      }
    } catch {
      toast('Impossible de générer le lien de partage', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={createShare} disabled={loading} className="btn-secondary !py-1.5 !text-xs">
        {loading ? '…' : 'Lien partage (7 j)'}
      </button>
      {url && <p className="truncate text-[10px] text-ink-subtle">Copié dans le presse-papier</p>}
    </div>
  );
}

export function PresentationModeToggle({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors ${
        active ? 'border-ink bg-ink text-white' : 'border-line text-ink-muted hover:bg-surface-muted'
      }`}
    >
      {active ? 'Quitter présentation' : 'Mode présentation'}
    </button>
  );
}
