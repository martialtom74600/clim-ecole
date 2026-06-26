import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="saas-shell flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="text-8xl font-bold tabular-nums text-slate-200">404</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">Pack introuvable</h1>
      <p className="mt-2 text-slate-500">Ce dossier n&apos;existe pas ou a été retiré.</p>
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
