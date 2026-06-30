import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { COPY } from '@/lib/copy';
import { getCoverageBadge } from '@/lib/coverage';
import { BrandLogo } from '@/components/brand/logo';

export async function PublicFooter() {
  const coverageBadge = await getCoverageBadge();
  return (
    <footer className="mt-auto border-t border-line py-10 print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 md:flex-row md:justify-between md:px-8">
        <div>
          <BrandLogo size="sm" />
          <p className="mt-3 max-w-xs text-sm text-ink-muted">
            Prospection de marchés publics scolaires · {coverageBadge}.
          </p>
          <p className="mt-2 text-xs text-ink-subtle">{COPY.estimatesNote}</p>
        </div>
        <div className="flex gap-12 text-sm">
          <div className="space-y-2">
            <Link href="/explorer" className="block text-ink-muted transition-colors duration-200 hover:text-ink">{COPY.explorer}</Link>
            <Link href="/tarifs" className="block text-ink-muted transition-colors duration-200 hover:text-ink">Tarifs</Link>
            <Link href="/legal/methodologie" className="block text-ink-muted transition-colors duration-200 hover:text-ink">Méthodologie</Link>
          </div>
          <div className="space-y-2">
            <Link href="/compte" className="block text-ink-muted transition-colors duration-200 hover:text-ink">Mon compte</Link>
            <Link href="/legal/cgu" className="block text-ink-muted transition-colors duration-200 hover:text-ink">CGU</Link>
            <Link href="/legal/confidentialite" className="block text-ink-muted transition-colors duration-200 hover:text-ink">Confidentialité</Link>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-7xl px-5 text-xs text-ink-subtle md:px-8">
        © {new Date().getFullYear()} {BRAND.name} · Strate Studio
      </p>
    </footer>
  );
}
