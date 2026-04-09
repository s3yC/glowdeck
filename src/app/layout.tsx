import './globals.css';
import type { Metadata } from 'next';
import { ClientProviders } from '@/components/dashboard/ClientProviders';

export const metadata: Metadata = {
  title: 'GlowDeck',
  description: 'Display your Tech with GlowDeck',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GlowDeck',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
