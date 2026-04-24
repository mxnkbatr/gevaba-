import { Playfair_Display, Inter } from 'next/font/google'
import '@/app/globals.css'
import { ClerkProvider } from '@clerk/nextjs'

/** Variable cuts: one WOFF2 each vs many static weights — faster FCP/LCP on mobile */
const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  display: 'swap',
  adjustFontFallback: true,
})

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
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
      en: '/en',
      mn: '/mn',
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Root layout is the only place that can define <html>/<body>.
  // Locale-specific providers live in app/[locale]/layout.tsx.
  return (
    <ClerkProvider>
      <html lang="mn" suppressHydrationWarning>
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no"
          />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#f2f2f7" />
          <link rel="preconnect" href="https://res.cloudinary.com" />
          <link rel="dns-prefetch" href="https://res.cloudinary.com" />
          <link rel="preconnect" href="https://clerk-telemetry.com" />
          <link rel="preconnect" href="https://img.clerk.com" />
        </head>
        <body className={`${playfair.variable} ${inter.variable} font-sans overflow-x-hidden antialiased overscroll-none`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
