import { PersonaLandingPage } from '@/components/marketplace/persona-landing-page';
import { PERSONA_LANDINGS } from '@/lib/gtm';

export default function EscoLandingPage() {
  return <PersonaLandingPage content={PERSONA_LANDINGS.esco} />;
}
