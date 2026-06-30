import { COPY } from '@/lib/copy';
import { LegalLayout } from '@/components/layout/legal-layout';

export default function ConfidentialitePage() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      verdict="Vos données de compte restent les vôtres — nous ne revendons rien."
      subline="Email, achats et préférences. Paiements via Stripe."
    >
      <section>
        <h2>Données que nous collectons</h2>
        <p>
          Email (alertes, facturation), historique d&apos;achats et préférences de filtrage.
          Les paiements sont traités par Stripe — nous ne stockons pas vos coordonnées bancaires.
        </p>
      </section>
      <section>
        <h2>Données publiques</h2>
        <p>
          Les informations sur les bâtiments proviennent de sources ouvertes (BDNB, DPE, Éducation nationale).
          Aucune donnée personnelle de tiers n&apos;est vendue.
        </p>
      </section>
      <section>
        <h2>Vos droits</h2>
        <p>
          Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données
          en contactant notre DPO. Réponse sous 30 jours.
        </p>
      </section>
      <p>
        Contact :{' '}
        <a href="mailto:contact@strate.studio" className="text-ink">
          contact@strate.studio
        </a>
      </p>
      <p className="text-sm text-ink-subtle">{COPY.estimatesNote}</p>
    </LegalLayout>
  );
}
