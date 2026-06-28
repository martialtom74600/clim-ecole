import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { getCoverageScopePhrase } from '@/lib/coverage';

export default async function MethodologiePage() {
  const scope = await getCoverageScopePhrase();

  return (
    <div className="page-content">
      <Link href="/" className="btn-ghost mb-6 -ml-2 text-sm">
        ← Accueil
      </Link>
      <h1 className="text-3xl font-semibold">Comment ça marche</h1>
      <p className="mt-4 text-radar-muted">
        Clim École recense les écoles primaires passoires thermiques {scope},
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
          <h2 className="text-lg font-semibold text-radar-text">Couverture géographique</h2>
          <p className="mt-2">
            Le périmètre s&apos;étend progressivement à toute la France métropolitaine,
            département par département. Les territoires déjà cartographiés restent visibles
            sur la carte ; les nouveaux départements sont ajoutés automatiquement après chaque
            cycle de prospection.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-radar-text">Score de priorité</h2>
          <p className="mt-2">
            Chaque territoire reçoit une note de A (excellent) à D (faible), calculée à partir
            du budget travaux, du ratio de subventions, du nombre de passoires thermiques et
            de la température commerciale (chaud / tiède / froid).
          </p>
          <p className="mt-2">
            Un dossier est marqué « prioritaire » si {COPY.qualifiedCriteria.toLowerCase()}.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-radar-text">Limites</h2>
          <p className="mt-2">{COPY.estimatesNote}</p>
        </section>
      </div>
    </div>
  );
}
