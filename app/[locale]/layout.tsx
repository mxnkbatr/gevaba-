import { LanguageProvider } from '../contexts/LanguageContext'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/contexts/AuthContext'
import SmoothScroll from '../components/SmoothScroll'
import Navbar from '../components/Navbar'
import CapacitorInitWrapper from '../capacitor/CapacitorInitWrapper'
import { NotificationProvider } from '@/contexts/NotificationContext'
import OfflineBanner from '../components/OfflineBanner'
import { CartProvider } from '@/contexts/CartContext'
import CartDrawerClient from "../components/CartDrawerClient"
import RealTimeCallHandler from '../components/RealTimeCallHandler'
import PageTransition from '../components/PageTransition'

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const validLocale = (['mn', 'en'].includes(locale) ? locale : 'mn') as any;

  return (
    <LanguageProvider initialLocale={validLocale}>
      <AuthProvider initialUser={null}>
        <ThemeProvider attribute="class" forcedTheme="light" defaultTheme="light" enableSystem={false}>
          <OfflineBanner />
          <CapacitorInitWrapper />
          {/* SmoothScroll only for desktop — on native we use CSS momentum */}
          <SmoothScroll />
          <CartProvider>
            <NotificationProvider>
              <RealTimeCallHandler />
              <Navbar />
              <CartDrawerClient />
              {/*
                native-scroll: iOS momentum scrolling (-webkit-overflow-scrolling: touch)
                overflow-x: hidden prevents horizontal bleed during page transitions
              */}
              <div
                className="native-scroll w-full"
                style={{ overflowX: "hidden" }}
              >
                <main
                  className="w-full relative overflow-x-hidden bg-cream"
                  style={{
                    paddingTop: 'calc(env(safe-area-inset-top, 44px) + 44px)',
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
                    /* Promote to GPU layer for jank-free page transition */
                    isolation: 'isolate',
                  }}
                >
                  {/* PageTransition wraps children — iOS push/pop animation on each route change */}
                  <PageTransition>
                    {children}
                  </PageTransition>
                </main>
              </div>
            </NotificationProvider>
          </CartProvider>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}