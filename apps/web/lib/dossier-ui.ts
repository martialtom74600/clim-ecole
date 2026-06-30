/**
 * Tokens visuels — dossier territoire.
 *
 * Gabarit horizontal : max-w-7xl px-5 md:px-8 — identique à toute l'application
 * (topbar, footer, page-content). L'œil ne bouge pas d'un pixel en naviguant.
 *
 * Rythme vertical : multiples de 8pt (py-10 = 40px, py-12 = 48px, gap-12 = 48px).
 */

export const DOSSIER_PAGE = 'min-h-screen bg-white';

/** Glassmorphism parfait — bg-white/80 + backdrop-blur-xl pour un effet premium au scroll */
export const DOSSIER_STICKY =
  'sticky top-14 z-40 border-b border-line/60 bg-white/80 backdrop-blur-xl transition-shadow duration-300';

/** Shadow conditionnelle au scroll — ajoutée via JS dans dossier-app.tsx */
export const DOSSIER_STICKY_SCROLLED = 'shadow-sm';

/** Gabarit identique à .page-content et topbar/footer */
export const DOSSIER_CONTENT = 'mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-12';

export const DOSSIER_SECTION = 'border-b border-line py-12 last:border-b-0';

export const DOSSIER_SECTION_TITLE = 'text-base font-semibold text-ink';

export const DOSSIER_SECTION_DESC = 'mt-1 text-sm text-ink-muted';

/** Bloc contenu discret — pas de grosse tuile arrondie */
export const DOSSIER_BLOCK = 'rounded-lg border border-line bg-surface-sunken p-5 md:p-6';

/**
 * KPI premium — contraste typographique extrême.
 * font-extrabold tracking-tighter pour les grandes données financières.
 */
export const DOSSIER_KPI = 'text-4xl font-extrabold tracking-tighter text-ink tabular-nums';

/**
 * Label de KPI — discret, uppercase, tracking maximal.
 * Contraste volontaire avec la donnée massive.
 */
export const DOSSIER_KPI_LABEL = 'text-[11px] font-semibold uppercase tracking-widest text-ink-subtle';

export const DOSSIER_STACK = 'space-y-12';

/**
 * Carte prospect desktop — hauteur viewport sans sticky (page longue en 4 sections).
 * topbar + header dossier ≈ 220px ; max-h évite une carte trop haute sur grands écrans.
 */
export const DOSSIER_MAP_DESKTOP =
  'h-[calc(100vh-220px)] min-h-[320px] max-h-[560px]';
