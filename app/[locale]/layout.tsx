// app/layout.tsx
import { Playfair_Display, Inter } from 'next/font/google'
import '@/app/globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { LanguageProvider } from '../contexts/LanguageContext'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/contexts/AuthContext'
import SmoothScroll from '../components/SmoothScroll'
import Navbar from '../components/Navbar'
import CapacitorInitWrapper from '../capacitor/CapacitorInitWrapper'
import { NotificationProvider } from '@/contexts/NotificationContext'
import OfflineBanner from '../components/OfflineBanner'
import SplashScreenGate from '../components/SplashScreenGate'

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
  adjustFontFallback: true,
})

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: true,
})

export const metadata = {
  metadataBase: new URL('https://gevabal.mn'),
  title: 'Gevabal - Spiritual Guidance',
  description: 'Book spiritual consultations with experienced monks',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  alternates: {
    canonical: './',
    languages: {
      'en': '/en',
      'mn': '/mn',
    },
  },
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const validLocale = (['mn', 'en'].includes(locale) ? locale : 'mn') as any;

  let serverUser = null;

  // We rely on the client-side AuthContext calling /api/auth/me to properly hydrate user 
  // and load complex MongoDB/JWT state without blocking Server Side Rendering (SSR) 

  return (
    <ClerkProvider>
      <LanguageProvider initialLocale={validLocale}>
        <AuthProvider initialUser={serverUser}>
          <html lang={validLocale} suppressHydrationWarning>
            <head>
              {/* Mobile viewport for edge-to-edge design */}
              <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no" />
              {/* iOS PWA meta tags */}
              <meta name="apple-mobile-web-app-capable" content="yes" />
              <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
              <meta name="mobile-web-app-capable" content="yes" />
              {/* Status bar / PWA tint — VCM-style cool canvas (#F8FAFC) */}
              <meta name="theme-color" content="#f2f2f7" />
              {/* Preconnects */}
              <link rel="preconnect" href="https://res.cloudinary.com" />
              <link rel="dns-prefetch" href="https://res.cloudinary.com" />
              <link rel="preconnect" href="https://clerk-telemetry.com" />
              <link rel="preconnect" href="https://img.clerk.com" />
            </head>
            <body className={`${playfair.variable} ${inter.variable} font-sans overflow-x-hidden antialiased overscroll-none`}>
              <ThemeProvider attribute="class" forcedTheme="light" defaultTheme="light" enableSystem={false}>
                <OfflineBanner />
                <CapacitorInitWrapper />
                <SmoothScroll />
                <NotificationProvider>
                  <Navbar />
                  <SplashScreenGate />
                  <div className="premium-scroll w-full h-full">
                    <main className="w-full relative overflow-x-hidden bg-cream" style={{
                      /* Space for floating native-style tab bar + safe area */
                      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)'
                    }}>
                      {children}
                    </main>
                  </div>
                </NotificationProvider>
              </ThemeProvider>
            </body>
          </html>
        </AuthProvider>
      </LanguageProvider>
    </ClerkProvider>
  )
}