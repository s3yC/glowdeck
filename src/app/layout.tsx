import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GlowDeck',
  description: 'Display your Tech with GlowDeck',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
