import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="saas-shell flex min-h-[70vh] flex-col items-center justify-center px-5 text-center animate-fade-in">
      <p className="text-8xl font-bold tabular-nums text-ink-faint">404</p>
      <h1 className="mt-4 text-xl font-semibold text-ink">Pack introuvable</h1>
      <p className="mt-2 text-ink-muted">Ce dossier n&apos;existe pas ou a été retiré.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/explorer" className="btn-primary">
          Ouvrir le Radar
        </Link>
        <Link href="/" className="btn-secondary">
          Accueil
        </Link>
      </div>
    </div>
  );
}
