import { Mail, MailX } from 'lucide-react';
import type { MarketplaceBuilding } from '@/lib/types';
import { COPY } from '@/lib/copy';
import { formatEur, formatInt } from '@/lib/format';
import { dpeBgClass, dpeLetter } from '@/lib/dpe-colors';
import { cn } from '@/lib/utils';

function sortByClosing(a: MarketplaceBuilding, b: MarketplaceBuilding) {
  return (b.scoreEligibiliteClosing ?? 0) - (a.scoreEligibiliteClosing ?? 0);
}

export function DossierSchoolCards({
  buildings,
  unlocked,
}: {
  buildings: MarketplaceBuilding[];
  unlocked: boolean;
}) {
  const sorted = [...buildings].sort(sortByClosing);

  if (sorted.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-400">Aucun établissement ne correspond à votre recherche.</p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {sorted.map((b, index) => (
        <li key={b.buildingId}>
          <SchoolCard building={b} unlocked={unlocked} rank={index + 1} />
        </li>
      ))}
    </ul>
  );
}

function SchoolCard({
  building: b,
  unlocked,
  rank,
}: {
  building: MarketplaceBuilding;
  unlocked: boolean;
  rank: number;
}) {
  const letter = dpeLetter(b.classeDpe);
  const isTop = rank <= 3 && (b.scoreEligibiliteClosing ?? 0) > 0;

  if (b.detailsHidden) {
    return (
      <div className="flex items-center gap-4 px-1 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">
          {rank}
        </span>
        <div>
          <p className="font-medium tracking-widest text-slate-300">{b.publicName}</p>
          <p className="text-xs text-slate-300">Détail après achat</p>
        </div>
      </div>
    );
  }

  return (
    <article
      className={cn(
        'group relative flex gap-4 px-1 py-4 transition-colors hover:bg-slate-50/80 md:gap-5 md:py-5',
        b.alerteFinancement && 'bg-amber-50/30 hover:bg-amber-50/50',
        isTop && 'before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-violet-500',
      )}
    >
      {/* Rank + DPE */}
      <div className="flex shrink-0 flex-col items-center gap-2">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold tabular-nums',
            isTop ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400',
          )}
        >
          {rank}
        </span>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl text-base font-black text-white shadow-sm',
            dpeBgClass(b.classeDpe),
          )}
          title={b.anneeDpe ? `DPE ${b.anneeDpe}` : undefined}
        >
          {letter}
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h3 className="font-semibold leading-snug text-slate-900">{b.publicName}</h3>
            <p className="text-sm text-slate-500">{b.publicCommune}</p>
            {unlocked && b.codeUai && (
              <p className="mt-0.5 font-mono text-[10px] text-slate-400">{b.codeUai}</p>
            )}
          </div>
          {b.scoreEligibiliteClosing != null && b.scoreEligibiliteClosing > 0 && (
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Score</p>
              <p className="text-lg font-bold tabular-nums text-slate-900">{b.scoreEligibiliteClosing}</p>
            </div>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Tag>{formatEur(b.capexTotal, true)}</Tag>
          {b.typeTravaux && <Tag>{b.typeTravaux}</Tag>}
          {b.puissancePacKw ? <Tag>{b.puissancePacKw} kW</Tag> : null}
          {b.surfaceM2 ? <Tag>{formatInt(b.surfaceM2)} m²</Tag> : null}
          {b.gainNetMairie != null && b.gainNetMairie > 0 && (
            <Tag accent>+{formatEur(b.gainNetMairie, true)}/an</Tag>
          )}
        </div>

        {(b.alerteSurdimensionnement || b.alerteFinancement) && (
          <p className="mt-2 text-xs text-amber-700">
            {b.alerteFinancement ?? '⚠ PAC possiblement surdimensionnée'}
          </p>
        )}
      </div>

      {/* Action */}
      <div className="hidden shrink-0 self-center sm:block">
        {b.emailMairie ? (
          <a
            href={`mailto:${b.emailMairie}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow"
          >
            <Mail className="h-4 w-4" />
            Contacter
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <MailX className="h-3.5 w-3.5" />
            {COPY.emailMissing}
          </span>
        )}
      </div>

      {/* Mobile action */}
      {b.emailMairie && (
        <a
          href={`mailto:${b.emailMairie}`}
          className="absolute inset-0 sm:hidden"
          aria-label={`Contacter ${b.publicName}`}
        />
      )}
    </article>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={cn(
        'rounded-md px-2 py-0.5 text-[11px] font-medium',
        accent ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600',
      )}
    >
      {children}
    </span>
  );
}
