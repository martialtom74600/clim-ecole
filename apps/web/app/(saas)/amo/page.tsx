import { PersonaLandingPage } from '@/components/marketplace/persona-landing-page';
import { PERSONA_LANDINGS } from '@/lib/gtm';
import { personaPageMetadata } from '@/lib/persona-page-meta';

export const metadata = personaPageMetadata(PERSONA_LANDINGS.amo);

export default function AmoLandingPage() {
  return <PersonaLandingPage content={PERSONA_LANDINGS.amo} />;
}
