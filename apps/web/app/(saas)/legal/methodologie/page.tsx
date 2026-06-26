import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { PERSONA_THRESHOLDS } from '@/lib/persona-engine';

export default function MethodologiePage() {
  return (
    <div className="page-content max-w-3xl">
      <Link href="/" className="btn-ghost mb-6 -ml-2 text-sm">
        ← Accueil
      </Link>
      <h1 className="text-3xl font-semibold">Comment ça marche</h1>
      <p className="mt-4 text-radar-muted">
        Clim École recense les écoles primaires passoires thermiques en Auvergne-Rhône-Alpes,
        estime les budgets de rénovation et classe les territoires pour vous aider à prospecter
        avant la publication des appels d&apos;offres.
      </p>

      <Link href="/explorer" className="btn-primary mt-6 inline-flex">
        {COPY.openExplorer} — voir la carte
      </Link>

      <div className="mt-10 space-y-8 text-radar-muted">
        <section>
          <h2 className="text-lg font-semibold text-radar-text">D&apos;où viennent les données ?</h2>
          <p className="mt-2">
            Nous croisons des sources publiques : la base nationale des bâtiments (BDNB),
            les diagnostics de performance énergétique (DPE), les données Éducation nationale
            et les barèmes de financement public (Fonds Vert, aides CEE).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-radar-text">Qu&apos;est-ce qu&apos;un territoire ?</h2>
          <p className="mt-2">
            Un territoire = une intercommunalité (EPCI) regroupant plusieurs communes.
            Les écoles primaires de ce territoire sont analysées ensemble car les collectivités
            financent souvent les travaux par lot, pas école par école.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-radar-text">Pourquoi les noms et la carte précise sont masqués ?</h2>
          <p className="mt-2">
            Les chiffres (budget, subventions, nombre d&apos;écoles) sont visibles gratuitement.
            La carte gratuite montre uniquement une <strong>vue agrégée par département</strong> — pas
            la position GPS des intercommunalités. Les noms des communes et écoles, ainsi que la
            localisation exacte, se débloquent à l&apos;achat du dossier (290 € HT) ou via l&apos;abonnement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-radar-text">Comment sont calculés les montants ?</h2>
          <p className="mt-2">
            Le budget travaux est une estimation (PAC, isolation…) basée sur les surfaces et
            le profil énergétique. Les subventions et le reste à charge sont modélisés selon
            les barèmes publics en vigueur. Ce ne sont pas des devis contractuels — utilisez-les
            pour prioriser, pas pour chiffrer un marché.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-radar-text">Le score de priorité (A à D)</h2>
          <p className="mt-2">
            Chaque territoire reçoit une note sur 100 et une lettre de A (excellent) à D (faible).
            Le score combine : volume de travaux, part de subventions, nombre de passoires thermiques,
            et faisabilité du montage financier. Un dossier est « prioritaire » si score B ou mieux
            et budget travaux supérieur à 400 000 €.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-radar-text">Filtres par métier</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Entreprises de travaux (BTP) : budget &gt; {PERSONA_THRESHOLDS.BTP_CAPEX_MIN.toLocaleString('fr-FR')} €</li>
            <li>Bureaux d&apos;études (BE) : majorité d&apos;écoles DPE F/G, surfaces adaptées à l&apos;audit</li>
            <li>Montage financier (AMO) : ratio subventions/budget &gt; {PERSONA_THRESHOLDS.AMO_SUBVENTION_RATIO_MIN * 100} %</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-radar-text">Limite d&apos;achats à l&apos;unité</h2>
          <p className="mt-2">
            Chaque territoire accepte un nombre limité d&apos;achats à l&apos;unité pour éviter
            que trop d&apos;entreprises contactent la même collectivité en même temps.
            L&apos;{COPY.subscription.toLowerCase()} débloque tous les territoires sans limite.
          </p>
        </section>
      </div>
    </div>
  );
}
