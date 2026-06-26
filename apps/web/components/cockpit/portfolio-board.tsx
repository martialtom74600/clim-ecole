import { getPipelineCards } from '@/lib/data';
import { KanbanBoard } from '@/components/cockpit/kanban-board';

export async function PortfolioKanban() {
  const cards = await getPipelineCards();
  return <KanbanBoard initialCards={cards} />;
}
