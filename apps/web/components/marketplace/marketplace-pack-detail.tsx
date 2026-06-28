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
import { TerritoryFreePreviewPanel } from '@/components/marketplace/territory-free-preview';
import { DossierTrustBar } from '@/components/marketplace/dossier-trust-bar';
import { DossierMgpeSection } from '@/components/marketplace/dossier-mgpe-section';
import { DossierArtisansSection } from '@/components/marketplace/dossier-artisans-section';
import { PackSchoolMap } from '@/components/marketplace/pack-school-map';
import { ActiveTenderBadge } from '@/components/marketplace/active-tender-badge';

export function MarketplacePackDetailView({ data }: { data: MarketplacePackDetail }) {
  const {
    pack,
    buildings,
    unlocked,
    freePreview,
    personaExplanations,
    radarFactors,
    communesLabel,
    nomEpci,
    dataLoadedAt,
    scoreClosingMax,
    mgpe,
    resteAChargeAfterSubsTotal,
  } = data;

  const racTotal = resteAChargeAfterSubsTotal ?? pack.packCapexTotal - pack.subventionsTotal;
  const subPct = Math.min(100, pack.subventionRatio * 100);
  const racPct = Math.min(100 - subPct, (racTotal / (pack.packCapexTotal || 1)) * 100);
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
            Liste masquée — débloquez pour voir chaque école (DPE, surfaces, montants, contacts).
          </p>
        )}
        {unlocked && (
          <p className="mt-1 text-xs text-radar-muted">
            CAPEX, gain net mairie, énergie, travaux et contacts par établissement
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-radar-border bg-radar-elevated text-[11px] uppercase tracking-wide text-radar-muted">
              <th className="px-6 py-3 font-semibold">École</th>
              <th className="px-4 py-3 font-semibold">DPE</th>
              <th className="px-4 py-3 text-right font-semibold">Surface</th>
              <th className="px-4 py-3 text-right font-semibold">CAPEX</th>
              <th className="px-4 py-3 text-right font-semibold">Gain net/an</th>
              <th className="px-4 py-3 font-semibold">Travaux</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-radar-border">
            {buildings.map((b) => (
              <tr key={b.buildingId} className="align-top">
                <td className="px-6 py-4">
                  <p
                    className={cn(
                      'font-medium',
                      unlocked ? 'text-radar-text' : 'tracking-widest text-radar-muted',
                    )}
                  >
                    {b.publicName}
                  </p>
                  <p className="text-xs text-radar-muted">{b.publicCommune}</p>
                  {unlocked && b.codeUai && (
                    <p className="mt-0.5 font-mono text-[10px] text-radar-subtle">{b.codeUai}</p>
                  )}
                  {unlocked && b.alerteSurdimensionnement && (
                    <p className="mt-1 text-xs text-radar-heat" title={b.alerteSurdimensionnementNote}>
                      ⚠ PAC possiblement surdimensionnée
                    </p>
                  )}
                  {unlocked && b.alerteFinancement && (
                    <p className="mt-1 text-xs text-amber-600">{b.alerteFinancement}</p>
                  )}
                </td>
                {b.detailsHidden ? (
                  <td colSpan={6} className="px-4 py-4 text-xs text-radar-subtle">
                    Détail après achat
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-4">
                      <DpeBadge classe={b.classeDpe} />
                      {b.anneeDpe ? (
                        <p className="mt-1 text-[10px] text-radar-subtle">DPE {b.anneeDpe}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-radar-muted">
                      {formatInt(b.surfaceM2)} m²
                      {b.consoSpecifiqueKwhM2 ? (
                        <p className="text-[10px]">{b.consoSpecifiqueKwhM2} kWh/m²</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold tabular-nums">
                      {formatEur(b.capexTotal, true)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-radar-signal">
                      {formatEur(b.gainNetMairie, true)}
                    </td>
                    <td className="px-4 py-4 text-xs text-radar-muted">
                      {b.typeTravaux ?? '—'}
                      {b.puissancePacKw ? (
                        <p className="mt-0.5">{b.puissancePacKw} kW PAC</p>
                      ) : null}
                      {b.dureeEstimeeSemaines ? (
                        <p className="mt-0.5">{b.dureeEstimeeSemaines} sem.</p>
                      ) : null}
                      {b.periodeIdealeChantier ? (
                        <p className="mt-0.5">{b.periodeIdealeChantier}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      {b.emailMairie ? (
                        <a
                          href={`mailto:${b.emailMairie}`}
                          className="inline-flex items-center gap-1 text-xs text-radar-signal"
                        >
                          <Mail className="h-3 w-3" />
                          {b.emailMairie}
                        </a>
                      ) : (
                        <span className="text-xs text-radar-subtle">{COPY.emailMissing}</span>
                      )}
                      {b.scoreEligibiliteClosing != null && b.scoreEligibiliteClosing > 0 && (
                        <p className="mt-1 text-[10px] text-radar-muted">
                          Score {b.scoreEligibiliteClosing} · {b.closingTemperature}
                        </p>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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
          <RadarScoreBadge score={pack.radarScore} grade={pack.radarGrade} previewOnly={!unlocked} />
          <PersonaBadgeGroup personas={pack.personas} size="md" />
          {pack.isQualified && <span className="badge-qualified">{COPY.qualified}</span>}
          {pack.isNew && <span className="badge-new">{COPY.new}</span>}
          {pack.isHot && <span className="badge-hot">{COPY.hot}</span>}
          {pack.hasActiveTender && (
            <ActiveTenderBadge title={pack.tenderTitle} />
          )}
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
            ? `${pack.department}${nomEpci ? ` · ${nomEpci}` : ''} · ${pack.batimentCount} écoles${communesLabel ? ` · ${communesLabel}` : ''}`
            : `${pack.department} · ${pack.batimentCount} écoles · montants exacts et contacts après déblocage`}
        </p>
        {unlocked && (pack.statutProjetEpci || scoreClosingMax) && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {pack.statutProjetEpci && (
              <span className="rounded-md bg-radar-elevated px-2.5 py-1 text-radar-muted">
                {COPY.statutProjet} · {pack.statutProjetEpci.replace(/_/g, ' ')}
              </span>
            )}
            {scoreClosingMax != null && scoreClosingMax > 0 && (
              <span className="rounded-md bg-radar-elevated px-2.5 py-1 text-radar-muted">
                {COPY.scoreClosing} · {scoreClosingMax}/100 · {pack.temperatureLevel}
              </span>
            )}
          </div>
        )}
        {unlocked && radarFactors && radarFactors.length > 0 && (
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
        <>
          <DossierTrustBar
            dataLoadedAt={dataLoadedAt}
            nomEpci={nomEpci}
            communesLabel={communesLabel}
          />
          <div className="mb-8">
            <PostPurchaseChecklist packId={pack.packId} />
          </div>
        </>
      )}

      {!unlocked && freePreview && (
        <div className="mb-8">
          <TerritoryFreePreviewPanel
            preview={freePreview}
            batimentCount={pack.batimentCount}
            department={pack.department}
            radarGrade={pack.radarGrade}
          />
        </div>
      )}

      {unlocked && (
        <>
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <FinanceCard
              label={COPY.budgetTravaux}
              hint={COPY.budgetTravauxHint}
              value={formatEur(pack.packCapexTotal, true)}
              highlight
            />
            <FinanceCard
              label={COPY.subventions}
              hint={COPY.subventionsHint}
              value={formatEur(pack.subventionsTotal, true)}
            />
            <FinanceCard
              label={COPY.resteAChargeAfterSubs}
              hint={COPY.resteAChargeAfterSubsHint}
              value={formatEur(racTotal, true)}
              accent
            />
            <FinanceCard
              label={COPY.partFondsVert}
              hint={COPY.partFondsVertHint}
              value={formatEur(pack.resteAChargeTotal, true)}
            />
            <FinanceCard
              label={COPY.gainNetMairie}
              hint={COPY.gainNetMairieHint}
              value={`${formatEur(pack.gainNetMairieTotal, true)}/an`}
            />
            <FinanceCard
              label={COPY.fondsVert}
              hint={COPY.fondsVertHint}
              value={formatEur(pack.fondsVertPotential, true)}
            />
          </div>

          <div className="card mb-8 p-6 md:p-8">
            <p className="text-sm font-medium">Répartition du financement</p>
            <p className="mt-1 text-xs text-radar-muted">
              Subventions publiques vs reste à charge après aides (hors lissage MGPE)
            </p>
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-radar-elevated">
              <div className="bg-radar-signal transition-all" style={{ width: `${subPct}%` }} title="Subventions" />
              <div className="bg-radar-heat transition-all" style={{ width: `${racPct}%` }} title="Reste à charge" />
            </div>
            <div className="mt-4 flex flex-wrap gap-6 text-xs text-radar-muted">
              <span>
                <GlossaryTerm term="Subventions">{COPY.subventions}</GlossaryTerm>{' '}
                {formatEur(pack.subventionsTotal, true)} ({formatPct(pack.subventionRatio)})
              </span>
              <span>
                <GlossaryTerm term="Reste à charge (RAC)">{COPY.resteAChargeAfterSubs}</GlossaryTerm>{' '}
                {formatEur(racTotal, true)}
              </span>
              <span title={COPY.partFondsVertHint}>
                {COPY.partFondsVert} {formatEur(pack.resteAChargeTotal, true)}
              </span>
              {pack.roiAnnees > 0 && (
                <span className="font-semibold text-radar-signal">
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

          {mgpe && (
            <div className="mb-8">
              <DossierMgpeSection mgpe={mgpe} />
            </div>
          )}

          <div className="mb-8">
            <DossierArtisansSection buildings={buildings} />
          </div>

          <div className="mb-8">
            <PackSchoolMap buildings={buildings} />
          </div>
        </>
      )}

      {!unlocked ? (
        <PaywallOverlay
          buildingCount={buildings.length}
          capex={freePreview?.budgetRange}
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
