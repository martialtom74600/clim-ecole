'use client';

import { Download, FileCode, FileText } from 'lucide-react';
import Link from 'next/link';
import type { MarketplacePack } from '@/lib/types';
import type { TerritoryFreePreview } from '@/lib/freemium';
import { DossierShareButton } from '@/components/marketplace/dossier-client-tools';
import { DossierInlinePaywall } from '@/components/marketplace/dossier-inline-paywall';
import { GlossaryTerm } from '@/components/ui/glossary-term';
import { DOSSIER_CONTENT, DOSSIER_SECTION, DOSSIER_SECTION_DESC, DOSSIER_SECTION_TITLE } from '@/lib/dossier-ui';
import { cn } from '@/lib/utils';

const EXPORTS = [
  {
    href: (id: string) => `/api/marketplace/export/${id}`,
    icon: Download,
    label: 'Liste des écoles (tableur)',
    desc: 'Écoles, DPE, budgets et contacts mairies',
    download: true,
  },
  {
    href: (id: string) => `/api/marketplace/export/${id}?full=1`,
    icon: Download,
    label: 'Export complet',
    desc: 'Artisans, alertes, coordonnées GPS',
    download: true,
  },
  {
    href: (id: string) => `/api/marketplace/dossier/${id}`,
    icon: FileCode,
    label: 'Dossier tiers-financement (HTML)',
    desc: 'Montage zéro avance',
    download: true,
  },
  {
    href: (id: string) => `/explorer/${id}/note`,
    icon: FileText,
    label: "Note d'opportunité",
    desc: 'Document A4 marque blanche',
    download: false,
  },
  {
    href: (id: string) => `/explorer/${id}/one-pager`,
    icon: FileText,
    label: 'Synthèse pour le maire',
    desc: 'Une page pour les élus',
    download: false,
    primary: true,
  },
] as const;

export function DossierTabExports({
  packId,
  pack,
  unlocked,
  soldOut,
  freePreview,
}: {
  packId: string;
  pack: MarketplacePack;
  unlocked: boolean;
  soldOut?: boolean;
  freePreview?: TerritoryFreePreview;
}) {
  return (
    <div className={DOSSIER_CONTENT}>
      <section className={DOSSIER_SECTION}>
        <h2 className={DOSSIER_SECTION_TITLE}>Documents & exports</h2>
        <p className={DOSSIER_SECTION_DESC}>
          Livrables pour vos rendez-vous ou votre{' '}
          <GlossaryTerm term="Pipeline">suivi commercial</GlossaryTerm>
        </p>

        {/* Liste d'exports + un seul overlay paywall si verrouillé */}
        <div className="relative mt-6">
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {EXPORTS.map(({ href, icon: Icon, label, desc, download, ...rest }) => {
              const primary = 'primary' in rest && rest.primary;
              const rowClass = cn(
                'flex items-start gap-4 px-4 py-4 transition-colors',
                primary ? 'bg-ink text-white' : 'bg-white hover:bg-surface-sunken',
                !unlocked && 'pointer-events-none blur-[2px] select-none opacity-60',
              );

              const content = (
                <>
                  <Icon
                    className={cn(
                      'mt-0.5 h-5 w-5 shrink-0',
                      primary ? 'text-white/80' : 'text-ink-subtle',
                    )}
                  />
                  <span>
                    <span className="block text-sm font-medium">{label}</span>
                    <span
                      className={cn(
                        'mt-0.5 block text-sm',
                        primary ? 'text-white/70' : 'text-ink-muted',
                      )}
                    >
                      {desc}
                    </span>
                  </span>
                </>
              );

              return (
                <li key={label}>
                  {unlocked && download ? (
                    <a href={href(packId)} className={rowClass} download>
                      {content}
                    </a>
                  ) : unlocked ? (
                    <Link href={href(packId)} className={rowClass}>
                      {content}
                    </Link>
                  ) : (
                    <div className={rowClass}>{content}</div>
                  )}
                </li>
              );
            })}
          </ul>

          {!unlocked && (
            <DossierInlinePaywall
              pack={pack}
              soldOut={soldOut}
              title="Exports inclus dans le déblocage"
              subtitle="Tableurs, synthèse maire et dossier tiers-financement."
            />
          )}
        </div>

        {/* Lien de partage — uniquement après déblocage */}
        {unlocked && (
          <div className="mt-8">
            <DossierShareButton packId={packId} />
          </div>
        )}
      </section>
    </div>
  );
}
