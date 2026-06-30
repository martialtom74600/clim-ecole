import { Suspense } from 'react';
import { PageGuide } from '@/components/layout/page-guide';
import { CockpitVerdict } from '@/components/cockpit/cockpit-verdict';
import { EpciTable } from '@/components/cockpit/epci-table';
import { EpciTableSkeleton } from '@/components/cockpit/epci-table-skeleton';
import { ADMIN_VERDICTS } from '@/lib/site-narrative';

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

export default function AdminEpciPage() {
  const v = ADMIN_VERDICTS.epci;

  return (
    <>
      <CockpitVerdict label={v.label} headline={v.headline} subline={v.subline} />
      <main className="page-content space-y-8">
        <PageGuide steps={GUIDE} />
        <Suspense fallback={<EpciTableSkeleton />}>
          <EpciTable />
        </Suspense>
      </main>
    </>
  );
}
