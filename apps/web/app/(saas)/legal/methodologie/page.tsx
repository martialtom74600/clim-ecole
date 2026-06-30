import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { getCoverageScopePhrase } from '@/lib/coverage';
import { PAGE_VERDICTS } from '@/lib/site-narrative';
import { NarrativeSection, NarrativeVerdict, SiteJourneySteps } from '@/components/layout/narrative-page';

export default async function MethodologiePage() {
  const scope = await getCoverageScopePhrase();
  const { label, headline, subline } = PAGE_VERDICTS.methodologie;

  return (
    <div>
      <NarrativeVerdict label={label} headline={headline} subline={subline}>
        <Link href="/explorer" className="btn-primary mt-6 inline-flex">
          {COPY.openExplorer}
        </Link>
      </NarrativeVerdict>

      <NarrativeSection title="Le parcours utilisateur">
        <SiteJourneySteps />
      </NarrativeSection>

      <NarrativeSection title="Sources de données">
        <p className="text-sm leading-relaxed text-ink-muted">
          Nous croisons des sources publiques : la base nationale des bâtiments (BDNB),
          les diagnostics de performance énergétique (DPE), les données Éducation nationale
          et les barèmes de financement public (Fonds Vert, aides CEE).
        </p>
      </NarrativeSection>

      <NarrativeSection title="Couverture géographique">
        <p className="text-sm leading-relaxed text-ink-muted">
          Périmètre actuel : écoles primaires passoires thermiques {scope}. Le recensement
          s&apos;étend progressivement à toute la France métropolitaine, département par département.
        </p>
      </NarrativeSection>

      <NarrativeSection title="Score de priorité (A–D)">
        <p className="text-sm leading-relaxed text-ink-muted">
          Chaque territoire reçoit une note de A (excellent) à D (faible), calculée à partir
          du budget travaux, du ratio de subventions, du nombre de passoires thermiques et
          de la température commerciale.
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          Un dossier est marqué « prioritaire » si {COPY.qualifiedCriteria.toLowerCase()}.
        </p>
      </NarrativeSection>

      <div className="page-content border-t border-line pt-8">
        <p className="text-sm text-ink-subtle">{COPY.estimatesNote}</p>
        <Link href="/" className="btn-ghost -ml-2 mt-4 inline-flex text-sm">
          ← Accueil
        </Link>
      </div>
    </div>
  );
}
