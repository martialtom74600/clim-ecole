import type { Metadata } from 'next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
import { AnalyticsScripts } from '@/components/analytics/analytics-scripts';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Clim École — Prospection rénovation scolaire',
  description: 'Passoires thermiques et subventions sur les territoires scolaires en France.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <AnalyticsScripts />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
