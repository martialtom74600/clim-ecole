import { PersonaLandingPage } from '@/components/marketplace/persona-landing-page';
import { PERSONA_LANDINGS } from '@/lib/gtm';
import { personaPageMetadata } from '@/lib/persona-page-meta';

export const metadata = personaPageMetadata(PERSONA_LANDINGS.be);

export default function BeLandingPage() {
  return <PersonaLandingPage content={PERSONA_LANDINGS.be} />;
}
