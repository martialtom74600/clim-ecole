import { PublicTopbar } from '@/components/layout/public-topbar';
import { PublicFooter } from '@/components/layout/public-footer';

export default function SaasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="saas-shell flex min-h-screen flex-col">
      <PublicTopbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
