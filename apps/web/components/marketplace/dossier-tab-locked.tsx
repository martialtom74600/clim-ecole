import { Lock, MapPin } from 'lucide-react';
import type { MarketplaceBuilding, MarketplacePack } from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { COPY, SCORE_GRADES } from '@/lib/copy';
import { PersonaDossierTips } from '@/components/marketplace/persona-dossier-tips';
import { DossierPaywallCard } from '@/components/marketplace/dossier-paywall-card';
import {
  DossierFreeVsUnlockedTable,
  DossierLockedSchoolTeaser,
} from '@/components/marketplace/dossier-locked-school-teaser';

function LockedMapPlaceholder() {
  return (
    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <MapPin className="h-5 w-5 text-slate-400" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-700">Carte des établissements</p>
      <p className="mt-1 max-w-xs text-xs text-slate-500">
        Localisation exacte et artisans RGE — disponibles après déblocage
      </p>
    </div>
  );
}

export function DossierTabFinanceLocked({
  pack,
  freePreview,
  soldOut,
}: {
  pack: MarketplacePack;
  freePreview?: TerritoryFreePreview;
  soldOut: boolean;
}) {
  const previewItems = freePreview
    ? [
        { label: COPY.budgetTravaux, value: freePreview.budgetRange, hint: COPY.budgetRangeHint },
        { label: COPY.subventions, value: freePreview.subventionLevel, hint: 'Niveau estimé' },
        { label: 'Profil DPE', value: freePreview.dpeProfile.worstClass, hint: freePreview.dpeProfile.label },
        {
          label: COPY.scorePriorite,
          value: `${pack.radarGrade} · ${pack.radarScore}`,
          hint: SCORE_GRADES[pack.radarGrade],
        },
      ]
    : [
        { label: COPY.budgetTravaux, value: pack.budgetRange, hint: COPY.budgetRangeHint },
        { label: COPY.subventions, value: pack.subventionLevelLabel, hint: 'Niveau estimé' },
        { label: COPY.ecoles, value: String(pack.batimentCount), hint: pack.department },
        {
          label: COPY.scorePriorite,
          value: `${pack.radarGrade} · ${pack.radarScore}`,
          hint: SCORE_GRADES[pack.radarGrade],
        },
      ];

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-y-auto p-4 lg:grid-cols-[3fr_7fr] lg:overflow-hidden">
      <div className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-900">Aperçu financier</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Tranches indicatives — montants exacts après achat</p>
          <dl className="mt-3 space-y-2.5">
            {previewItems.map(({ label, value, hint }) => (
              <div key={label} className="flex items-start justify-between gap-3 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                <dt className="text-[11px] text-slate-500">{label}</dt>
                <dd className="text-right">
                  <span className="block text-sm font-semibold tabular-nums text-slate-900">{value}</span>
                  {hint && <span className="mt-0.5 block text-[10px] text-slate-400">{hint}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <PersonaDossierTips personas={pack.personas} />
      </div>

      <div className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto">
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-slate-500">
            <Lock className="h-4 w-4" />
            <span className="text-xs font-semibold">Simulateur RAC & argumentaire MGPE</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Jauge de financement, simulateur reste à charge et pitch MGPE-PD — inclus dans le dossier débloqué.
          </p>
        </div>
        <DossierPaywallCard pack={pack} freePreview={freePreview} soldOut={soldOut} embedded />
      </div>
    </div>
  );
}

export function DossierTabProspectLocked({
  buildings,
  freePreview,
}: {
  buildings: MarketplaceBuilding[];
  freePreview?: TerritoryFreePreview;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4 lg:grid lg:grid-cols-12">
      <div className="h-36 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white lg:hidden">
        <LockedMapPlaceholder />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white lg:col-span-7 lg:h-full">
        <DossierLockedSchoolTeaser buildings={buildings} preview={freePreview} embedded />
      </div>

      <div className="hidden min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white lg:col-span-5 lg:flex lg:h-full lg:flex-col">
        <LockedMapPlaceholder />
      </div>
    </div>
  );
}

export function DossierTabExportsLocked({
  pack,
  freePreview,
  soldOut,
}: {
  pack: MarketplacePack;
  freePreview?: TerritoryFreePreview;
  soldOut: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-2xl space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Téléchargements</p>
          <p className="text-xs text-slate-500">Exports prêts pour votre CRM ou vos rendez-vous</p>
        </div>

        <div className="grid gap-2 opacity-50 sm:grid-cols-2" aria-hidden>
          {['CSV CRM', 'CSV complet', COPY.exportMgpeHtml, 'Note PDF'].map((label) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4"
            >
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>
                <span className="block text-sm font-semibold text-slate-700">{label}</span>
                <span className="mt-0.5 block text-xs text-slate-400">Après déblocage</span>
              </span>
            </div>
          ))}
        </div>

        <DossierPaywallCard pack={pack} freePreview={freePreview} soldOut={soldOut} embedded />
        <DossierFreeVsUnlockedTable />
      </div>
    </div>
  );
}
