import { isTestMode } from '@/lib/test-mode';

export function TestModeBanner() {
  if (!isTestMode()) return null;

  return (
    <div
      className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-950"
      role="status"
    >
      <strong>Mode test</strong> — tous les territoires sont débloqués sans Stripe. Désactive avec{' '}
      <code className="rounded bg-amber-500/20 px-1">CLIM_TEST_MODE=0</code> avant la prod.
    </div>
  );
}
