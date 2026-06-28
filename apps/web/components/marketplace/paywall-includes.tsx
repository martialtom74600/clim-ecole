import { Check } from 'lucide-react';
import { PAYWALL_INCLUDES } from '@/lib/site-guide';
import { COPY } from '@/lib/copy';

export function PaywallIncludes() {
  return (
    <div className="card p-6 md:p-8">
      <h2 className="text-lg font-semibold">Ce que vous obtenez en débloquant</h2>
      <p className="mt-2 text-sm text-radar-muted">
        Tout est prêt pour prospecter — pas besoin de recroiser des fichiers Excel ou la BDNB vous-même.
      </p>
      <ul className="mt-5 space-y-3">
        {PAYWALL_INCLUDES.map((item) => (
          <li key={item} className="flex gap-3 text-sm text-radar-muted">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-radar-signal" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-radar-subtle">{COPY.estimatesNote}</p>
    </div>
  );
}
