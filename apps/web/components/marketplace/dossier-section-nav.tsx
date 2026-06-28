'use client';

import { cn } from '@/lib/utils';
import { DOSSIER_SECTIONS } from '@/lib/site-guide';

export function DossierSectionNav({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        'sticky top-14 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md',
        className,
      )}
      aria-label="Sections du dossier"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-5 py-2 md:px-8">
        {DOSSIER_SECTIONS.map(({ id, label, shortLabel }) => (
          <a
            key={id}
            href={`#${id}`}
            className="whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 aria-[current=page]:bg-slate-900 aria-[current=page]:text-white"
          >
            <span className="md:hidden">{shortLabel ?? label}</span>
            <span className="hidden md:inline">{label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
