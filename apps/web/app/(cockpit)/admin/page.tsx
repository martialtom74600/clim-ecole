import { Suspense } from 'react';
import { PageGuide } from '@/components/layout/page-guide';
import { CockpitQuickLinks } from '@/components/cockpit/cockpit-hero';
import { CockpitVerdict } from '@/components/cockpit/cockpit-verdict';
import { HotLeadsStrip } from '@/components/cockpit/hot-leads-strip';
import { KpiCards } from '@/components/cockpit/kpi-cards';
import { KpiCardsSkeleton } from '@/components/cockpit/kpi-cards-skeleton';
import { QuickTriage } from '@/components/cockpit/quick-triage';
import { QuickTriageSkeleton } from '@/components/cockpit/quick-triage-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { ADMIN_VERDICTS } from '@/lib/site-narrative';

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
  const v = ADMIN_VERDICTS.dashboard;

  return (
    <>
      <CockpitVerdict label={v.label} headline={v.headline} subline={v.subline}>
        <Suspense fallback={<Skeleton className="mt-6 h-20 w-full rounded-xl" />}>
          <CockpitQuickLinks />
        </Suspense>
      </CockpitVerdict>

      <main className="page-content space-y-8">
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
    </>
  );
}
