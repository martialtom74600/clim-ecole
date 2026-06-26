import Link from 'next/link';
import { ArrowRight, Building2, Gem, Map } from 'lucide-react';
import { getDashboardKpis } from '@/lib/data';

export async function CockpitHero() {
  const kpis = await getDashboardKpis();
  const LINKS = [
    { href: '/admin/epci', icon: Building2, label: 'Intercommunalités', desc: 'Territoires à prospecter' },
    { href: '/admin/portefeuilles', icon: Gem, label: 'Suivi dossiers', desc: 'Où tu en es' },
    { href: '/admin/carte', icon: Map, label: 'Carte', desc: `${kpis.totalBatiments} écoles` },
  ];

  return (
    <section className="panel relative overflow-hidden p-8">
      <div className="relative">
        <p className="label-caps text-emerald-700">Strate Studio · Clim École</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">
          Cockpit origination · {kpis.totalBatiments} écoles
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          Rénovation d&apos;écoles pour les collectivités — données complètes, non masquées.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {LINKS.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 transition-all hover:border-slate-300 hover:shadow-sm"
            >
              <Icon className="h-5 w-5 text-slate-500 group-hover:text-emerald-600" strokeWidth={1.75} />
              <div>
                <p className="text-[15px] font-semibold text-slate-900">{label}</p>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-600" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
