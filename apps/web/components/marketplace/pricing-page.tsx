import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COPY } from '@/lib/copy';
import { CheckoutButton } from '@/components/marketplace/checkout-button';
import { GlossaryTerm } from '@/components/ui/glossary-term';

const FREE_FEATURES = [
  'Carte et liste de tous les territoires AURA',
  'Budget travaux et subventions estimés',
  'Nombre d\'écoles et score de priorité',
  'Filtres par métier (BTP, BE, AMO)',
];

const PLANS = [
  {
    id: 'dossier',
    name: 'Un territoire',
    price: '290',
    period: '€ HT',
    desc: 'Débloquez un intercommunalité : noms, contacts, exports. Accès 30 jours.',
    features: [
      'Noms des communes et écoles',
      'Emails des mairies',
      'Détail DPE et surfaces par bâtiment',
      'Export PDF montage financier (MGPE-PD)',
    ],
    highlight: false,
  },
  {
    id: 'pro',
    name: COPY.subscription,
    price: '990',
    period: '€ HT / mois',
    desc: 'Tous les territoires débloqués pour votre équipe commerciale.',
    features: [
      'Accès illimité à tous les dossiers',
      'Exports CSV et PDF',
      'Alertes email nouveaux territoires',
      'Jusqu\'à 3 utilisateurs',
    ],
    highlight: true,
  },
];

export function PricingPage({ highlightPlan }: { highlightPlan?: string }) {
  return (
    <div className="page-content">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Tarifs</h1>
        <p className="mt-2 text-radar-muted">
          Consultez gratuitement. Payez uniquement quand vous voulez les noms et contacts.
        </p>

        {/* Gratuit */}
        <div className="card mt-10 p-6">
          <h2 className="font-semibold">Gratuit — sans carte bancaire</h2>
          <ul className="mt-4 space-y-2 text-sm text-radar-muted">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-radar-text" />{f}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn('card p-8', (plan.highlight || highlightPlan === plan.id) && 'border-radar-text ring-1 ring-radar-text/10')}
            >
              <h2 className="font-semibold">{plan.name}</h2>
              <p className="mt-1 text-sm text-radar-muted">{plan.desc}</p>
              <p className="mt-6 font-mono text-4xl font-medium tabular-nums">
                {plan.price}
                <span className="ml-1 text-sm font-normal text-radar-muted">{plan.period}</span>
              </p>
              <ul className="mt-6 space-y-2 border-t border-radar-border pt-6 text-sm text-radar-muted">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <CheckoutButton
                plan={plan.id as 'dossier' | 'pro'}
                className={cn('mt-8 w-full', plan.highlight ? 'btn-primary' : 'btn-secondary')}
              >
                {plan.id === 'dossier' ? 'Acheter un territoire' : "S'abonner"}
              </CheckoutButton>
            </div>
          ))}
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
