import { Check, Mail } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { COPY } from '@/lib/copy';
import { CheckoutButton } from '@/components/marketplace/checkout-button';
import { GlossaryTerm } from '@/components/ui/glossary-term';
import { PRICING_TIERS } from '@/lib/gtm';

export function PricingPage({
  highlightPlan,
  coverageBadge = 'France',
}: {
  highlightPlan?: string;
  coverageBadge?: string;
}) {
  const freeFeatures = [
    `Carte et liste des territoires recensés (${coverageBadge})`,
    'Tranche de budget et niveau de subventions (sans montant exact)',
    'Profil énergétique agrégé et score de priorité (A à D)',
    'Filtres par métier (BTP, BE, AMO, ESCO, CEE)',
  ];

  return (
    <div className="page-content">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tarifs</h1>
        <p className="mt-2 text-radar-muted">
          Priorisez gratuitement. Payez pour chiffrer, contacter et exporter — ou contactez-nous pour les offres équipe et institutionnelles.
        </p>

        <div className="card mt-10 p-6">
          <h2 className="font-semibold text-ink">Gratuit — sans carte bancaire</h2>
          <ul className="mt-4 space-y-2 text-sm text-ink-muted">
            {freeFeatures.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" />{f}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PRICING_TIERS.map((plan) => {
            const flagship = plan.id === 'dataroom';
            return (
            <div
              key={plan.id}
              className={cn(
                'card flex flex-col p-6',
                (plan.highlight || highlightPlan === plan.id) && 'border-ink ring-1 ring-ink/10 shadow-raised',
                flagship && 'bg-ink text-white lg:col-span-1',
              )}
            >
              <div className="flex items-center gap-2">
                <h2 className={cn('font-semibold', flagship ? 'text-white' : 'text-ink')}>{plan.name}</h2>
                {flagship && (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Institutionnel
                  </span>
                )}
              </div>
              <p className={cn('mt-1 text-sm', flagship ? 'text-white/70' : 'text-ink-muted')}>{plan.desc}</p>
              <p className={cn('mt-4 font-mono text-3xl font-medium tabular-nums', flagship ? 'text-white' : 'text-ink')}>
                {plan.price}
                <span className={cn('ml-1 text-sm font-normal', flagship ? 'text-white/60' : 'text-ink-muted')}>{plan.period}</span>
              </p>
              <ul
                className={cn(
                  'mt-4 flex-1 space-y-2 border-t pt-4 text-sm',
                  flagship ? 'border-white/15 text-white/80' : 'border-line text-ink-muted',
                )}
              >
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {'checkout' in plan && plan.checkout ? (
                <CheckoutButton
                  plan={plan.id as 'dossier' | 'pro'}
                  className={cn('mt-6 w-full', plan.highlight ? 'btn-primary' : 'btn-secondary')}
                >
                  {plan.id === 'dossier' ? 'Acheter un territoire' : "S'abonner"}
                </CheckoutButton>
              ) : (
                <a
                  href="mailto:contact@clim-ecole.fr?subject=Clim%20École%20—%20Offre%20entreprise"
                  className={cn(
                    'mt-6 inline-flex w-full justify-center gap-2',
                    flagship
                      ? 'items-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.02] active:scale-95'
                      : 'btn-secondary',
                  )}
                >
                  <Mail className="h-4 w-4" />
                  Nous contacter
                </a>
              )}
            </div>
            );
          })}
        </div>

        <p className="mt-10 text-sm text-radar-muted">
          <GlossaryTerm term="MGPE-PD">MGPE-PD</GlossaryTerm> : contrat de performance énergétique permettant à la collectivité
          de rembourser les travaux sur la durée grâce aux économies d&apos;énergie.
        </p>
        <p className="mt-4 text-xs text-radar-subtle">{COPY.estimatesNote}</p>
      </div>
    </div>
  );
}
