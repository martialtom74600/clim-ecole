'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  Building2,
  Gem,
  FileSpreadsheet,
  CircleHelp,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/admin/carte', icon: Map, label: 'Carte' },
  { href: '/admin/epci', icon: Building2, label: 'Intercommunalités' },
  { href: '/admin/portefeuilles', icon: Gem, label: 'Suivi dossiers' },
  { href: '/admin/export', icon: FileSpreadsheet, label: 'Export' },
  { href: '/admin/aide', icon: CircleHelp, label: 'Aide' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="group fixed inset-y-0 left-0 z-40 hidden w-14 flex-col border-r border-line bg-surface/95 backdrop-blur-xl transition-all duration-200 md:flex lg:w-16 lg:hover:w-56">
      <div className="flex h-14 items-center gap-3 border-b border-line px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-base font-bold text-white">
          C
        </div>
        <span className="truncate text-[15px] font-semibold text-ink opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Cockpit Admin
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active =
            href === '/admin'
              ? pathname === '/admin'
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-ink-muted transition-all duration-200 hover:bg-surface-sunken hover:text-ink',
                active && 'bg-ink/5 text-ink ring-1 ring-inset ring-line',
              )}
            >
              <Icon className="h-[19px] w-[19px] shrink-0" strokeWidth={1.75} />
              <span className="truncate text-[14px] font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-line p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-muted hover:text-ink"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Vitrine SaaS
        </Link>
        <p className="truncate px-2 text-xs text-ink-muted">Strate Studio</p>
      </div>
    </aside>
  );
}
