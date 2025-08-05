
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/cart-context';
import { AuthProvider } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import { PageLoader } from '@/components/layout/page-loader';
import { Suspense } from 'react';
import { Inter, Oswald } from 'next/font/google';
import { SearchProvider } from '@/context/search-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' });

export const metadata: Metadata = {
  title: 'LE QG DE LA SAPE',
  description: "L'élégance a son quartier général.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${oswald.variable}`}>
      <head />
      <body className="font-body antialiased min-h-screen flex flex-col">
        <Suspense fallback={null}>
          <PageLoader />
        </Suspense>
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>
              <SearchProvider>
                {children}
              </SearchProvider>
              <Toaster />
            </CartProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
