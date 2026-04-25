import './globals.css';
import NextAuthSessionProvider from './SessionProvider';
import LayoutWrapper from './components/LayoutWrapper';

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Hari Har Namkeen ERP & POS',
  description: 'Offline ERP and POS System for Hari Har Namkeen',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#f97316',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NextAuthSessionProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
