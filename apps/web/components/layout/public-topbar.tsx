'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { BrandLogo } from '@/components/brand/logo';

const NAV = [
  { href: '/explorer', label: 'Explorateur' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/legal/methodologie', label: 'Comment ça marche' },
];

export function PublicTopbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] border-b border-radar-border bg-white/90 backdrop-blur-sm print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:px-8">
        <Link href="/"><BrandLogo size="md" /></Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'text-sm transition-colors',
                pathname.startsWith(href) ? 'font-medium text-radar-text' : 'text-radar-muted hover:text-radar-text',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/compte" className="btn-ghost"><User className="h-4 w-4" />Mon compte</Link>
          <Link href="/tarifs?plan=pro" className="btn-primary !py-2 !text-sm">990 €/mois · tout débloquer</Link>
        </div>

        <button type="button" className="p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-radar-border px-5 py-4 md:hidden">
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium">
              {label}
            </Link>
          ))}
          <div className="mt-3 space-y-2 border-t border-radar-border pt-3">
            <Link href="/compte" className="btn-secondary block text-center">Mon compte</Link>
            <Link href="/tarifs?plan=pro" className="btn-primary block text-center">Voir les tarifs</Link>
          </div>
        </div>
      )}
    </header>
  );
}
