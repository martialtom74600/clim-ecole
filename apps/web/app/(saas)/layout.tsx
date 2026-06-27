import { PublicTopbar } from '@/components/layout/public-topbar';
import { PublicFooter } from '@/components/layout/public-footer';
import { TestModeBanner } from '@/components/dev/test-mode-banner';

export default function SaasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="saas-shell flex min-h-screen flex-col">
      <TestModeBanner />
      <PublicTopbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
