import { cn } from '@/lib/utils';

/**
 * Structure spatiale standardisée des en-têtes — saas & cockpit.
 *
 * Saas (compte, dossier, explorateur) :
 *   — Zone H1 gauche (titre + sous-titre)
 *   — Zone actions droite (boutons)
 *   — Zone onglets/filtres en dessous (slot optionnel)
 *
 * Cockpit (admin) : compatibilité assurée via les props `description`,
 * `breadcrumb` et `count` (ancienne interface).
 *
 * Rythme : mb-8 sépare l'en-tête du contenu (multiple de 8pt).
 */
export function PageHeader({
  title,
  subtitle,
  description,
  meta,
  actions,
  tabs,
  className,
  breadcrumb,
  count,
}: {
  title: React.ReactNode;
  /** Description principale sous le titre */
  subtitle?: React.ReactNode;
  /** Alias rétrocompat de subtitle (ancienne interface cockpit) */
  description?: React.ReactNode;
  /** Zone méta au-dessus du titre — fil d'Ariane, retour, badge */
  meta?: React.ReactNode;
  /** Boutons et actions — zone droite */
  actions?: React.ReactNode;
  /** Onglets ou filtres — zone sous le titre */
  tabs?: React.ReactNode;
  className?: string;
  /** Rétrocompat cockpit — fil d'Ariane */
  breadcrumb?: { label: string; href?: string }[];
  /** Rétrocompat cockpit — compteur affiché à côté du titre */
  count?: number;
}) {
  const effectiveSubtitle = subtitle ?? description;

  return (
    <div className={cn('mb-8 space-y-4', className)}>
      {/* Fil d'Ariane cockpit */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-ink-subtle">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-ink">{crumb.label}</a>
              ) : (
                <span className="text-ink-muted">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {meta && <div className="mb-2">{meta}</div>}
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">{title}</h1>
            {count !== undefined && (
              <span className="font-mono text-sm tabular-nums text-ink-subtle">{count}</span>
            )}
          </div>
          {effectiveSubtitle && (
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{effectiveSubtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
        )}
      </div>
      {tabs && <div>{tabs}</div>}
    </div>
  );
}
