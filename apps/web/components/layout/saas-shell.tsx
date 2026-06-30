import { PublicFooter } from '@/components/layout/public-footer';
import { SaasShellFrame } from '@/components/layout/saas-shell-frame';

export function SaasShell({ children }: { children: React.ReactNode }) {
  return <SaasShellFrame footer={<PublicFooter />}>{children}</SaasShellFrame>;
}
