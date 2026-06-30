import { Suspense } from 'react';
import { PageGuide } from '@/components/layout/page-guide';
import { CockpitVerdict } from '@/components/cockpit/cockpit-verdict';
import { PortfolioKanban } from '@/components/cockpit/portfolio-board';
import { PortfolioBoardSkeleton } from '@/components/cockpit/portfolio-board-skeleton';
import { ADMIN_VERDICTS } from '@/lib/site-narrative';

const GUIDE = [
  {
    step: 1,
    title: 'Comprends les cartes',
    description:
      'Chaque carte = une école seule ou un territoire entier. Le montant = budget travaux estimé.',
  },
  {
    step: 2,
    title: 'Glisse vers la droite',
    description:
      'Repéré → Intéressant → Dossier monté → Proposition → Signé. Tu avances au fil de tes échanges.',
  },
  {
    step: 3,
    title: 'Clique pour le détail',
    description:
      'Une carte t\'ouvre la fiche territoire avec la liste des écoles, le DPE et les chiffres.',
  },
];

export default function AdminPortefeuillesPage() {
  const v = ADMIN_VERDICTS.portefeuilles;

  return (
    <>
      <CockpitVerdict label={v.label} headline={v.headline} subline={v.subline} />
      <main className="page-content space-y-8">
        <PageGuide steps={GUIDE} />
        <Suspense fallback={<PortfolioBoardSkeleton />}>
          <PortfolioKanban />
        </Suspense>
      </main>
    </>
  );
}
