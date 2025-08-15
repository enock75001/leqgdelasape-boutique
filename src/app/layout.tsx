
'use client';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/cart-context';
import { AuthProvider } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import { PageLoader } from '@/components/layout/page-loader';
import { Suspense, useEffect, useState } from 'react';
import { Inter, Oswald } from 'next/font/google';
import { SearchProvider } from '@/context/search-context';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { PwaProvider } from '@/context/pwa-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const oswald = Oswald({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-oswald' });

const metadata: Metadata = {
  title: 'LE QG DE LA SAPE',
  description: "L'élégance a son quartier général.",
  manifest: "/manifest.json",
};

const themes = [
    {
        '--background': '240 10% 3.9%',
        '--foreground': '0 0% 98%',
        '--primary': '346.8 77.2% 49.8%',
        '--primary-foreground': '355.7 100% 97.3%',
        '--ring': '346.8 77.2% 49.8%',
        '--card': '240 10% 3.9% / 0.8',
    },
    {
        '--background': '240 10% 3.9%',
        '--foreground': '0 0% 98%',
        '--primary': '40 95% 55%',
        '--primary-foreground': '240 10% 3.9%',
        '--ring': '40 95% 55%',
        '--card': '240 10% 3.9% / 0.8',
    },
    {
        '--background': '240 10% 3.9%',
        '--foreground': '0 0% 98%',
        '--primary': '170 80% 50%',
        '--primary-foreground': '0 0% 100%',
        '--ring': '170 80% 50%',
        '--card': '240 10% 3.9% / 0.8',
    },
    {
        '--background': '222.2 84% 4.9%',
        '--foreground': '210 40% 98%',
        '--primary': '217.2 91.2% 59.8%',
        '--primary-foreground': '222.2 47.4% 11.2%',
        '--ring': '217.2 91.2% 59.8%',
        '--card': '222.2 84% 4.9% / 0.8',
    }
];

function ThemeInjector() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        const root = document.documentElement;
        for (const [key, value] of Object.entries(randomTheme)) {
        root.style.setProperty(key, value);
        }
    }
  }, [isMounted]);

  return null;
}

function FacebookPixel() {
    const pathname = usePathname();
    const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

    useEffect(() => {
        if (!pixelId || pixelId === '0000000000000') return;
        // This is the page view event
        import('react-facebook-pixel')
            .then((x) => x.default)
            .then((ReactPixel) => {
                ReactPixel.pageView();
            });

    }, [pathname]);

    if (!pixelId || pixelId === '0000000000000') return null;

    return (
        <Suspense fallback={null}>
            <Script id="facebook-pixel-init" strategy="afterInteractive">
                {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                fbq('track', 'PageView');
                `}
            </Script>
        </Suspense>
    );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
    if (pixelId && pixelId !== '0000000000000') {
      import('react-facebook-pixel')
        .then(x => x.default)
        .then(ReactPixel => {
          ReactPixel.init(pixelId, {}, {
            autoConfig: true,
            debug: false,
          });
        });
    }
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
          .catch((error) => console.error('Service Worker registration failed:', error));
    }
  }, []);

  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${oswald.variable}`}>
      <head>
        <title>{String(metadata.title)}</title>
        <meta name="description" content={metadata.description ?? undefined} />
        <meta name="google-site-verification" content="ub6lkur6aic7" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <ThemeInjector />
        <Suspense>
          <PageLoader />
          <FacebookPixel />
        </Suspense>
        <PwaProvider>
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
        </PwaProvider>
      </body>
    </html>
  );
}
