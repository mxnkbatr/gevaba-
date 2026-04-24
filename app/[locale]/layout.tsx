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
    <LanguageProvider initialLocale={validLocale}>
      <AuthProvider initialUser={serverUser}>
        <ThemeProvider attribute="class" forcedTheme="light" defaultTheme="light" enableSystem={false}>
          <OfflineBanner />
          <CapacitorInitWrapper />
          <SmoothScroll />
          <CartProvider>
            <NotificationProvider>
              <Navbar />
              <CartDrawerClient />
              <div className="premium-scroll w-full h-full">
                <main
                  className="w-full relative overflow-x-hidden bg-cream"
                  style={{
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
                  }}
                >
                  {children}
                </main>
              </div>
            </NotificationProvider>
          </CartProvider>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}