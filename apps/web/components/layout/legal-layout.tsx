import Link from 'next/link';
import { NarrativeVerdict } from '@/components/layout/narrative-page';

export function LegalLayout({
  title,
  verdict,
  subline,
  children,
}: {
  title: string;
  verdict?: string;
  subline?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <NarrativeVerdict
        label={title}
        headline={verdict ?? title}
        subline={subline}
        className="!py-8 md:!py-10"
      />
      <div className="page-content !pt-0">
        <Link href="/" className="btn-ghost -ml-2 mb-6 text-sm">
          ← Accueil
        </Link>
        <div className="space-y-6 leading-relaxed text-ink-muted [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink">
          {children}
        </div>
      </div>
    </div>
  );
}
