'use client';

import { usePathname } from 'next/navigation';
import { PublicTopbar } from '@/components/layout/public-topbar';
import { cn } from '@/lib/utils';

/** Plein écran carte — pas de footer, main en hauteur fixe. */
function isExplorerMapRoute(pathname: string): boolean {
  return pathname === '/explorer';
}

export function SaasShellFrame({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const mapMode = isExplorerMapRoute(pathname);

  return (
    <div
      className={cn(
        'saas-shell flex flex-col',
        mapMode ? 'h-[100svh] overflow-hidden' : 'min-h-screen',
      )}
    >
      <PublicTopbar />
      <main className={cn('flex-1', mapMode && 'min-h-0 overflow-hidden')}>{children}</main>
      {!mapMode && footer}
    </div>
  );
}
