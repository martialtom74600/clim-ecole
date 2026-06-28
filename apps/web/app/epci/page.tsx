import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PageGuide } from '@/components/layout/page-guide';
import { EpciTable } from '@/components/cockpit/epci-table';
import { EpciTableSkeleton } from '@/components/cockpit/epci-table-skeleton';

const GUIDE = [
  {
    step: 1,
    title: 'Cherche ou filtre',
    description:
      'Tape un nom de commune, ou clique 🔥 Chaud / > 1 M€ / Pack prêt pour réduire la liste.',
  },
  {
    step: 2,
    title: 'Ouvre une fiche',
    description:
      'Chaque ligne = un territoire (plusieurs communes). Clique pour voir les écoles et les montants.',
  },
  {
    step: 3,
    title: 'Repère le statut',
    description:
      '« Pack prêt » = dossier solide. « À grouper » = il manque peut-être des écoles pour débloquer les aides.',
  },
];

export default function EpciPage() {
  return (
    <main className="page-content">
      <PageHeader
        title="Intercommunalités"
        description="Chaque ligne = un territoire regroupant plusieurs communes et écoles"
      />
      <PageGuide steps={GUIDE} />
      <Suspense fallback={<EpciTableSkeleton />}>
        <EpciTable />
      </Suspense>
    </main>
  );
}
