import { getAllEpciSummary } from '@/lib/data';
import { EpciTableClient } from '@/components/cockpit/epci-table-client';

export async function EpciTable() {
  const rows = await getAllEpciSummary();
  return <EpciTableClient rows={rows} />;
}
