import Link from 'next/link';
import { ArrowRight, Building2, Gem, Map } from 'lucide-react';
import { getDashboardKpis } from '@/lib/data';

/** Liens rapides cockpit — sans titre (le verdict est au-dessus). */
export async function CockpitQuickLinks() {
  const kpis = await getDashboardKpis();
  const LINKS = [
    { href: '/admin/epci', icon: Building2, label: 'Intercommunalités', desc: 'Territoires à prospecter' },
    { href: '/admin/portefeuilles', icon: Gem, label: 'Suivi dossiers', desc: 'Où tu en es' },
    { href: '/admin/carte', icon: Map, label: 'Carte', desc: `${kpis.totalBatiments} écoles` },
  ];

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {LINKS.map(({ href, icon: Icon, label, desc }) => (
        <Link
          key={href}
          href={href}
          className="group flex items-center gap-3 rounded-xl border border-line bg-white px-5 py-4 transition-all hover:border-line-strong hover:shadow-sm"
        >
          <Icon className="h-5 w-5 text-ink-muted group-hover:text-positive-text" strokeWidth={1.75} />
          <div>
            <p className="text-[15px] font-semibold text-ink">{label}</p>
            <p className="text-sm text-ink-muted">{desc}</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-ink-muted group-hover:translate-x-0.5 group-hover:text-ink-soft" />
        </Link>
      ))}
    </div>
  );
}

/** @deprecated Utiliser CockpitVerdict + CockpitQuickLinks */
export async function CockpitHero() {
  return (
    <section className="panel relative overflow-hidden p-8">
      <CockpitQuickLinks />
    </section>
  );
}
