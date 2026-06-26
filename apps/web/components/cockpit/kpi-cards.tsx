import { getDashboardKpis } from '@/lib/data';
import { KpiCardsView } from '@/components/cockpit/kpi-cards-view';

export async function KpiCards() {
  const kpis = await getDashboardKpis();
  return <KpiCardsView kpis={kpis} />;
}
