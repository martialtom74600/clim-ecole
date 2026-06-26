import Link from 'next/link';
import { getHotLeadsPreview } from '@/lib/data';
import { formatEur } from '@/lib/format';
import { Flame } from 'lucide-react';

export async function HotLeadsStrip() {
  const leads = await getHotLeadsPreview(6);
  if (!leads.length) return null;

  return (
    <section className="panel border-zen-teal/25 bg-gradient-to-r from-zen-teal/8 to-transparent p-6 shadow-glow">
      <div className="mb-4 flex items-center gap-3">
        <Flame className="h-5 w-5 text-zen-teal" strokeWidth={1.75} />
        <h2 className="text-[15px] font-semibold text-zen-teal">À traiter en priorité</h2>
        <Link
          href="/admin/portefeuilles"
          className="ml-auto text-sm text-zen-muted transition-colors hover:text-zen-teal"
        >
          Suivi dossiers →
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {leads.map((l) => (
          <Link
            key={l.codeUai}
            href={`/admin/epci/${l.codeEpci}`}
            className="shrink-0 rounded-xl border border-white/[0.08] bg-zen-elevated px-5 py-4 transition-all duration-200 hover:border-zen-teal/35 hover:bg-zen-hover"
          >
            <p className="max-w-[200px] truncate text-[15px] font-medium text-zinc-100">{l.nomEcole}</p>
            <p className="mt-0.5 text-sm text-zen-muted">{l.commune}</p>
            <p className="mt-2 text-lg font-semibold tabular-nums text-zen-teal">
              {formatEur(l.capex, true)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
