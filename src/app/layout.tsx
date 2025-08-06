
'use client';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/cart-context';
import { AuthProvider } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import { PageLoader } from '@/components/layout/page-loader';
import { Suspense, useEffect } from 'react';
import { Inter, Oswald } from 'next/font/google';
import { SearchProvider } from '@/context/search-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const oswald = Oswald({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-oswald' });

const metadata: Metadata = {
  title: 'LE QG DE LA SAPE',
  description: "L'élégance a son quartier général.",
  manifest: "/manifest.json",
};

const themes = [
    {
        '--background': '222.2 84% 4.9%',
        '--foreground': '210 40% 98%',
        '--primary': '142.1 76.2% 36.3%',
        '--primary-foreground': '142.1 76.2% 96.3%',
        '--ring': '142.1 76.2% 36.3%',
    },
    {
        '--background': '20 14.3% 4.1%',
        '--foreground': '60 9.1% 97.8%',
        '--primary': '346.8 77.2% 49.8%',
        '--primary-foreground': '355.7 100% 97.3%',
        '--ring': '346.8 77.2% 49.8%',
    },
    {
        '--background': '240 10% 3.9%',
        '--foreground': '0 0% 98%',
        '--primary': '40 95% 55%',
        '--primary-foreground': '240 10% 3.9%',
        '--ring': '40 95% 55%',
    },
    {
        '--background': '300 10% 4%',
        '--foreground': '0 0% 98%',
        '--primary': '280 80% 60%',
        '--primary-foreground': '0 0% 100%',
        '--ring': '280 80% 60%',
    },
    {
        '--background': '180 10% 4%',
        '--foreground': '0 0% 98%',
        '--primary': '170 80% 50%',
        '--primary-foreground': '0 0% 100%',
        '--ring': '170 80% 50%',
    }
];

function ThemeInjector() {
  useEffect(() => {
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const root = document.documentElement;
    for (const [key, value] of Object.entries(randomTheme)) {
      root.style.setProperty(key, value);
    }
  }, []);

  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${oswald.variable}`}>
      <head>
        <title>{String(metadata.title)}</title>
        <meta name="description" content={metadata.description ?? undefined} />
        <link rel="manifest" href={metadata.manifest ?? undefined} />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <ThemeInjector />
        <Suspense>
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
