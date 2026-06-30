import type { Metadata } from 'next';
import type { PersonaLandingContent } from '@/lib/gtm';

export function personaPageMetadata(content: PersonaLandingContent): Metadata {
  return {
    title: `${content.personaLabel} — Clim École`,
    description: content.heroSubtitle,
  };
}
