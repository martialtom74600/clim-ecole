import Link from 'next/link';
import { ArrowLeft, Lock, Mail, Unlock } from 'lucide-react';
import type { MarketplacePackDetail } from '@/lib/types';
import { formatEur, formatInt, formatPct } from '@/lib/format';
import { COPY } from '@/lib/copy';
import { PaywallOverlay } from '@/components/ui/paywall-overlay';
import { GlossaryTerm } from '@/components/ui/glossary-term';
import { DpeBadge } from '@/components/cockpit/badges';
import { cn } from '@/lib/utils';
import { PersonaBadgeGroup } from '@/components/brand/personas';
import { PersonaExplainPanel } from '@/components/marketplace/persona-explain';
import { RadarScoreBadge } from '@/components/marketplace/radar-score-badge';
import { RacSimulator } from '@/components/marketplace/rac-simulator';
import { WatchlistButton } from '@/components/marketplace/watchlist-button';
import { CheckoutButton } from '@/components/marketplace/checkout-button';
import { PackSlotsBadge } from '@/components/marketplace/pack-slots-badge';
import { PostPurchaseChecklist } from '@/components/marketplace/post-purchase-checklist';

export function MarketplacePackDetailView({ data }: { data: MarketplacePackDetail }) {
  const { pack, buildings, unlocked, personaExplanations, radarFactors } = data;
  const subPct = Math.min(100, pack.subventionRatio * 100);
  const racPct = Math.min(100 - subPct, (pack.resteAChargeTotal / (pack.packCapexTotal || 1)) * 100);
  const dossierSoldOut = pack.soldOut && !unlocked;

  const buildingList = (
    <div className="card overflow-hidden">
      <div className="border-b border-radar-border px-6 py-5">
        <h2 className="font-semibold text-radar-text">
          Écoles du territoire · {buildings.length} établissements
          {unlocked && (
            <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-radar-signal">
              <Unlock className="h-4 w-4" /> {COPY.unlocked}
            </span>
          )}
        </h2>
        {!unlocked && (
          <p className="mt-1 text-sm text-radar-muted">
            Noms masqués — débloquez le dossier pour voir communes, écoles et contacts.
          </p>
        )}
      </div>
      <div className="divide-y divide-radar-border">
        {buildings.map((b) => (
          <div
            key={b.buildingId}
            className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 sm:grid-cols-[2fr_1fr_auto_auto_auto]"
          >
            <div>
              <p
                className={cn(
                  'font-medium',
                  unlocked ? 'text-radar-text' : 'tracking-widest text-radar-muted',
                )}
              >
                {b.publicName}
              </p>
              <p className="text-xs text-radar-muted">{b.publicCommune}</p>
              {unlocked && b.emailMairie && (
                <a
                  href={`mailto:${b.emailMairie}`}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-radar-signal"
                >
                  <Mail className="h-3 w-3" />
                  {b.emailMairie}
                </a>
              )}
              {unlocked && b.alerteSurdimensionnement && (
                <p className="mt-1 text-xs text-radar-heat" title="La puissance PAC estimée dépasse les besoins réels — point d'attention pour le chiffrage">
                  ⚠ PAC possiblement surdimensionnée
                </p>
              )}
            </div>
            <DpeBadge classe={b.classeDpe} />
            <span className="hidden text-sm tabular-nums text-radar-muted sm:block">
              {formatInt(b.surfaceM2)} m²
            </span>
            <span className="text-sm font-semibold tabular-nums text-radar-text">
              {formatEur(b.capexTotal, true)}
            </span>
            <span className="hidden text-sm font-semibold tabular-nums text-radar-signal sm:block">
              {formatEur(b.resteACharge, true)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page-content !py-10 md:!py-14">
      <Link href="/explorer" className="btn-ghost mb-8 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        {COPY.backToExplorer}
      </Link>

      <header className="mb-10 animate-fade-in-up">
        <div className="flex flex-wrap items-center gap-2">
          <RadarScoreBadge score={pack.radarScore} grade={pack.radarGrade} />
          <PersonaBadgeGroup personas={pack.personas} size="md" />
          {pack.isQualified && (
            <span className="badge-qualified">{COPY.qualified}</span>
          )}
          {pack.isNew && <span className="badge-new">{COPY.new}</span>}
          {pack.isHot && <span className="badge-hot">{COPY.hot}</span>}
          <PackSlotsBadge
            remaining={pack.slotsRemaining}
            max={pack.slotsMax}
            soldOut={pack.soldOut}
            size="md"
          />
          {!unlocked ? (
            <span className="badge-locked">
              <Lock className="h-2.5 w-2.5" />
              {COPY.masked}
            </span>
          ) : (
            <span className="badge-qualified">{COPY.unlocked}</span>
          )}
          <WatchlistButton packId={pack.packId} />
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-radar-text md:text-4xl">
          {pack.publicName}
        </h1>
        <p className="mt-2 text-sm text-radar-muted">
          {unlocked
            ? `${pack.department} · ${pack.batimentCount} écoles · intercommunalité`
            : `${pack.batimentCount} écoles · localisation précise après déblocage`}
        </p>
        {radarFactors && radarFactors.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {radarFactors.slice(0, 3).map((f) => (
              <li key={f} className="rounded-md bg-radar-elevated px-2.5 py-1 text-xs text-radar-muted">
                {f}
              </li>
            ))}
          </ul>
        )}
      </header>

      {unlocked && (
        <div className="mb-8">
          <PostPurchaseChecklist packId={pack.packId} />
        </div>
      )}

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FinanceCard label={COPY.budgetTravaux} hint={COPY.budgetTravauxHint} value={formatEur(pack.packCapexTotal, true)} highlight />
        <FinanceCard label={COPY.resteACharge} hint={COPY.resteAChargeHint} value={formatEur(pack.resteAChargeTotal, true)} accent />
        <FinanceCard label={COPY.subventions} hint={COPY.subventionsHint} value={formatEur(pack.subventionsTotal, true)} />
        <FinanceCard label={COPY.fondsVert} hint={COPY.fondsVertHint} value={formatEur(pack.fondsVertPotential, true)} />
      </div>

      <div className="card mb-8 p-6 md:p-8">
        <p className="text-sm font-medium">Répartition du financement</p>
        <p className="mt-1 text-xs text-radar-muted">Part subventions vs part collectivité (estimation)</p>
        <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-radar-elevated">
          <div className="bg-radar-signal transition-all" style={{ width: `${subPct}%` }} title="Subventions" />
          <div className="bg-radar-heat transition-all" style={{ width: `${racPct}%` }} title="Reste à charge" />
        </div>
        <div className="mt-4 flex flex-wrap gap-6 text-xs text-radar-muted">
          <span><GlossaryTerm term="Subventions">{COPY.subventions}</GlossaryTerm> {formatEur(pack.subventionsTotal, true)} ({formatPct(pack.subventionRatio)})</span>
          <span><GlossaryTerm term="Reste à charge (RAC)">{COPY.resteACharge}</GlossaryTerm> {formatEur(pack.resteAChargeTotal, true)}</span>
          {pack.roiAnnees > 0 && (
            <span className="font-semibold text-radar-signal" title="Années pour que les économies d'énergie remboursent l'investissement">
              Retour sur investissement · {pack.roiAnnees.toFixed(1)} ans
            </span>
          )}
        </div>
      </div>

      {personaExplanations && (
        <div className="mb-8">
          <PersonaExplainPanel explanations={personaExplanations} />
        </div>
      )}

      <div className="mb-8">
        <RacSimulator capex={pack.packCapexTotal} baseSubventionRatio={pack.subventionRatio} />
      </div>

      {!unlocked ? (
        <PaywallOverlay
          buildingCount={buildings.length}
          capex={formatEur(pack.packCapexTotal, true)}
          packId={pack.packId}
          soldOut={dossierSoldOut}
          slotsRemaining={pack.slotsRemaining}
        >
          {buildingList}
        </PaywallOverlay>
      ) : (
        buildingList
      )}

      {!unlocked && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <CheckoutButton
            plan="dossier"
            packId={pack.packId}
            disabled={dossierSoldOut}
            className="btn-primary flex-1 py-4"
          >
            {dossierSoldOut ? COPY.soldOut : 'Débloquer ce territoire — 290 € HT'}
          </CheckoutButton>
          <CheckoutButton plan="pro" className="btn-secondary flex-1 py-4">
            {COPY.subscription} — 990 € HT/mois
          </CheckoutButton>
        </div>
      )}
    </div>
  );
}

function FinanceCard({
  label,
  hint,
  value,
  highlight,
  accent,
}: {
  label: string;
  hint?: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={cn('card p-5 md:p-6', highlight && 'border-radar-signal/40')} title={hint}>
      <p className="text-xs font-medium text-radar-muted">{label}</p>
      <p
        className={cn(
          'mt-2 text-2xl font-bold tabular-nums tracking-tight md:text-3xl',
          highlight && 'text-radar-signal',
          accent && !highlight && 'text-radar-heat',
          !highlight && !accent && 'text-radar-text',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-radar-subtle">{hint}</p>}
    </div>
  );
}
