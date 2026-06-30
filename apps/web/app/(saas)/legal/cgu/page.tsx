import { COPY } from '@/lib/copy';
import { getCoverageScopePhrase } from '@/lib/coverage';
import { LegalLayout } from '@/components/layout/legal-layout';

export default async function CguPage() {
  const scope = await getCoverageScopePhrase();

  return (
    <LegalLayout
      title="Conditions Générales d'Utilisation"
      verdict="Clim École est un outil de prospection — les montants affichés sont des estimations, pas un devis."
      subline="Usage interne de prospection. Gratuit pour prioriser, payant pour agir."
    >
      <p>
        Les présentes CGU régissent l&apos;accès à Clim École, plateforme de prospection
        éditée par Strate Studio. L&apos;utilisation du service implique l&apos;acceptation
        de ces conditions.
      </p>
      <h2>Objet du service</h2>
      <p>
        Clim École recense les opportunités de rénovation thermique des écoles primaires
        publiques {scope}. Les montants affichés (budget travaux, subventions,
        reste à charge) sont des estimations algorithmiques — pas un audit réglementaire
        ni un devis travaux.
      </p>
      <h2>Accès gratuit et payant</h2>
      <p>
        L&apos;{COPY.explorer.toLowerCase()} est gratuit : carte, liste, tranches de budget,
        profil énergétique agrégé et note de priorité — sans montants exacts ni contacts.
        L&apos;accès aux chiffres détaillés, noms de communes, écoles et contacts est payant
        (achat à l&apos;unité ou {COPY.subscription.toLowerCase()}). Prix HT.
      </p>
      <h2>Utilisation des exports</h2>
      <p>
        Les données débloquées sont licenciées pour un usage interne de prospection par
        l&apos;acheteur. Toute revente ou redistribution est interdite.
      </p>
      <p className="text-sm text-ink-subtle">{COPY.estimatesNote}</p>
    </LegalLayout>
  );
}
