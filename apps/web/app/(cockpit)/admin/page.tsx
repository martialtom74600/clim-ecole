import { Suspense } from 'react';
import { PageGuide } from '@/components/layout/page-guide';
import { CockpitHero } from '@/components/cockpit/cockpit-hero';
import { HotLeadsStrip } from '@/components/cockpit/hot-leads-strip';
import { KpiCards } from '@/components/cockpit/kpi-cards';
import { KpiCardsSkeleton } from '@/components/cockpit/kpi-cards-skeleton';
import { QuickTriage } from '@/components/cockpit/quick-triage';
import { QuickTriageSkeleton } from '@/components/cockpit/quick-triage-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

const GUIDE = [
  {
    step: 1,
    title: 'Lis les chiffres clés',
    description:
      'Les 4 cartes résument ton fichier. Survole les petites icônes (?) si un mot te bloque.',
  },
  {
    step: 2,
    title: 'Choisis une priorité',
    description:
      'Bandeau orange ou top 5 territoires : clique pour ouvrir la fiche détaillée.',
  },
  {
    step: 3,
    title: 'Passe au suivi',
    description:
      'Dès que tu as appelé ou relancé un contact, déplace la carte dans Suivi dossiers.',
  },
];

export default function AdminDashboardPage() {
  return (
    <main className="page-content space-y-8">
      <CockpitHero />
      <PageGuide steps={GUIDE} />

      <section aria-label="Priorités immédiates">
        <Suspense fallback={<Skeleton className="h-36 w-full rounded-2xl" />}>
          <HotLeadsStrip />
        </Suspense>
      </section>

      <section aria-label="Indicateurs clés">
        <Suspense fallback={<KpiCardsSkeleton />}>
          <KpiCards />
        </Suspense>
      </section>

      <section aria-label="Top territoires">
        <Suspense fallback={<QuickTriageSkeleton />}>
          <QuickTriage />
        </Suspense>
      </section>
    </main>
  );
}
