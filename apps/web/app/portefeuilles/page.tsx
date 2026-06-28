import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PageGuide } from '@/components/layout/page-guide';
import { PortfolioKanban } from '@/components/cockpit/portfolio-board';
import { PortfolioBoardSkeleton } from '@/components/cockpit/portfolio-board-skeleton';

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
      'Une carte t’ouvre la fiche territoire avec la liste des écoles, le DPE et les chiffres.',
  },
];

export default function PortefeuillesPage() {
  return (
    <main className="page-content">
      <PageHeader
        title="Suivi des dossiers"
        description="Glisse les cartes entre les étapes · tes choix sont sauvegardés sur ton Mac"
      />
      <PageGuide steps={GUIDE} />
      <Suspense fallback={<PortfolioBoardSkeleton />}>
        <PortfolioKanban />
      </Suspense>
    </main>
  );
}
