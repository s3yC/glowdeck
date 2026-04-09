import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ClientProviders } from '@/components/dashboard/ClientProviders';

export const metadata: Metadata = {
  title: 'GlowDeck',
  description: 'Display your Tech with GlowDeck',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GlowDeck',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
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
