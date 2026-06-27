import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { getCoverageScopePhrase } from '@/lib/coverage';

export default async function CguPage() {
  const scope = await getCoverageScopePhrase();

  return (
    <LegalLayout title="Conditions Générales d'Utilisation">
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
      <p className="text-sm text-radar-subtle">{COPY.estimatesNote}</p>
    </LegalLayout>
  );
}

function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="page-content prose prose-slate max-w-3xl">
      <Link href="/" className="btn-ghost mb-6 -ml-2 text-sm">
        ← Accueil
      </Link>
      <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
      <div className="mt-8 space-y-6 text-slate-600 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900">
        {children}
      </div>
    </div>
  );
}
