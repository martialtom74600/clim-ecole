import { PageHeader } from '@/components/layout/page-header';
import { GLOSSARY } from '@/lib/glossary';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function AidePage() {
  return (
    <main className="page-content">
      <PageHeader
        title="Aide & vocabulaire"
        description="Tout le jargon Clim École, expliqué simplement"
      />

      <Card className="mb-8 border-zen-teal/25 bg-zen-teal/5">
        <CardContent className="flex gap-4 p-6">
          <BookOpen className="mt-0.5 h-6 w-6 shrink-0 text-zen-teal" strokeWidth={1.75} />
          <div>
            <p className="text-[15px] font-medium text-zinc-100">Pas de formation préalable nécessaire</p>
            <p className="mt-2 text-base leading-relaxed text-zen-muted">
              Clim École t’aide à repérer des projets de rénovation d’écoles pour les
              collectivités. Survole les petites icônes{' '}
              <span className="text-zinc-500">(?)</span> dans l’app pour des rappels rapides.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {GLOSSARY.map((entry) => (
          <Card key={entry.term}>
            <CardContent className="p-5">
              <div className="mb-2 flex flex-wrap items-baseline gap-2">
                <h2 className="text-[15px] font-semibold text-zen-teal">{entry.term}</h2>
                <span className="text-sm text-zen-muted">= {entry.short}</span>
              </div>
              <p className="text-[15px] leading-relaxed text-zinc-400">{entry.plain}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
