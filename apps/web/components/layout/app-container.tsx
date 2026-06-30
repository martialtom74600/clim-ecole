import { cn } from '@/lib/utils';

/**
 * Master container — gabarit horizontal unique de l'application.
 * Toutes les pages utilisent max-w-7xl px-5 md:px-8 pour une ligne visuelle
 * parfaitement alignée entre topbar, contenu et footer.
 */
export function AppContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-5 md:px-8', className)}>
      {children}
    </div>
  );
}
