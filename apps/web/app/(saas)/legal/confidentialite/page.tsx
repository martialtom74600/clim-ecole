import Link from 'next/link';
import { COPY } from '@/lib/copy';

export default function ConfidentialitePage() {
  return (
    <div className="page-content">
      <Link href="/" className="btn-ghost mb-6 -ml-2 text-sm">
        ← Accueil
      </Link>
      <h1 className="text-3xl font-semibold">Politique de confidentialité</h1>
      <div className="mt-8 space-y-6 text-ink-muted">
        <section>
          <h2 className="text-lg font-semibold text-ink">Données que nous collectons</h2>
          <p className="mt-2">
            Email (alertes, facturation), historique d&apos;achats et préférences de filtrage.
            Les paiements sont traités par Stripe — nous ne stockons pas vos coordonnées bancaires.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Données publiques</h2>
          <p className="mt-2">
            Les informations sur les bâtiments proviennent de sources ouvertes (BDNB, DPE, Éducation nationale).
            Aucune donnée personnelle de tiers n&apos;est vendue.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Vos droits</h2>
          <p className="mt-2">
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
      </div>
    </div>
  );
}
