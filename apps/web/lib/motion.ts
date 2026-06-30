/**
 * Motion tokens — vocabulaire de mouvement unique de l'application.
 *
 * Inspiration : Linear / Vercel / Apple. Une seule grammaire d'animation,
 * pilotée par framer-motion, pour que chaque transition se ressemble et
 * que l'app paraisse « cohérente au pixel et à la milliseconde ».
 *
 * Règle d'or :
 *   — Entrée : courbe « ease-out expressive » (rapide puis décélère) → l'élément ARRIVE.
 *   — Sortie : courbe « ease-in » (accélère vers la disparition) → l'élément PART.
 *   — Tout le contenu de lecture monte légèrement (8–12px) en fondu, jamais de pop sec.
 *
 * Accessibilité : envelopper l'app dans <MotionConfig reducedMotion="user"> ;
 * framer-motion neutralise alors automatiquement transform/opacity quand
 * l'utilisateur a activé « réduire les animations ». Les helpers `useReducedMotion`
 * restent disponibles pour les cas sur-mesure.
 */

import type { Transition, Variants } from 'framer-motion';

/* ── Durées (secondes) ───────────────────────────────────────────────────── */
export const DURATION = {
  /** Micro-feedback (hover, pression, toggle) */
  fast: 0.18,
  /** Transition standard (entrée d'élément, changement d'onglet) */
  base: 0.28,
  /** Mouvement ample (section qui se lève, panneau qui glisse) */
  slow: 0.42,
} as const;

/* ── Courbes de Bézier ───────────────────────────────────────────────────── */
export const EASE = {
  /** Entrée expressive — démarre vite, décélère en douceur (signature Linear). */
  out: [0.22, 1, 0.36, 1] as const,
  /** Sortie — accélère vers la disparition. */
  in: [0.4, 0, 1, 1] as const,
  /** Symétrique — pour les boucles et les morphs de layout. */
  inOut: [0.65, 0, 0.35, 1] as const,
  /** Léger rebond contrôlé — réservé au delight (succès, sélection). */
  spring: [0.34, 1.4, 0.64, 1] as const,
} as const;

/* ── Transitions prêtes à l'emploi ───────────────────────────────────────── */
export const TRANSITION: Record<'fast' | 'base' | 'slow', Transition> = {
  fast: { duration: DURATION.fast, ease: EASE.out },
  base: { duration: DURATION.base, ease: EASE.out },
  slow: { duration: DURATION.slow, ease: EASE.out },
};

/** Spring naturel pour les animations de layout (réorganisation de liste, underline). */
export const SPRING: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 38,
  mass: 1,
};

/* ── Variants partagés ───────────────────────────────────────────────────── */

/** Fondu simple. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: TRANSITION.base },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE.in } },
};

/** Le pattern « le contenu se lève » — entrée de section / paragraphe / carte. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: TRANSITION.base },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.fast, ease: EASE.in } },
};

/** Apparition par mise à l'échelle — modales, popovers, badges. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: TRANSITION.base },
  exit: { opacity: 0, scale: 0.96, transition: { duration: DURATION.fast, ease: EASE.in } },
};

/**
 * Conteneur en cascade — orchestre l'apparition de ses enfants.
 * Utiliser avec `staggerItem` sur chaque enfant.
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

/** Enfant d'un conteneur en cascade. */
export const staggerItem: Variants = fadeUp;

/* ── Changement d'onglet directionnel ────────────────────────────────────── */

/**
 * Variants pour AnimatePresence (mode="wait") sur les onglets.
 * `direction` = 1 (avance, glisse depuis la droite) ou -1 (recule, depuis la gauche).
 */
export const tabContent = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 16 : -16,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: TRANSITION.base,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -16 : 16,
    transition: { duration: DURATION.fast, ease: EASE.in },
  }),
} satisfies Variants;

/* ── Viewport reveal (scroll-linked) ─────────────────────────────────────── */

/** Réglage standard pour `whileInView` — se déclenche une seule fois, à 15% visible. */
export const VIEWPORT_ONCE = { once: true, amount: 0.15 } as const;
