import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { AppChrome } from '@/components/layout/app-chrome';

export default async function CockpitLayout({ children }: { children: React.ReactNode }) {
  if (!(await getAdminSession())) {
    redirect('/admin/login');
  }

  return (
    <>
      <Sidebar />
      <MobileNav />
      <div className="flex min-h-screen flex-col pb-16 md:pb-0 md:pl-14 lg:pl-16">
        <Suspense
          fallback={
            <header className="sticky top-0 z-30 h-14 border-b border-line bg-zen-bg/90 backdrop-blur-xl" />
          }
        >
          <AppChrome />
        </Suspense>
        {children}
      </div>
    </>
  );
}
