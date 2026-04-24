import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const locales = ['mn', 'en'];
const defaultLocale = 'mn';
const JWT_SECRET = process.env.JWT_SECRET;

// CORS headers for mobile app access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/** Нэвтрэлт шаардлагатай зөвхөн эдгээр замууд — бусад дээр Clerk auth() дуудахгүй (dev/prod хоёуланд хурдан) */
function routeNeedsAuthGate(pathWithoutLocale: string): boolean {
  const p = pathWithoutLocale === '' ? '/' : pathWithoutLocale;
  if (p.startsWith('/admin')) return true;
  if (p.startsWith('/monk/content')) return true;
  if (p.startsWith('/messenger')) return true;
  if (p.startsWith('/booking/')) return true;
  if (p.startsWith('/dashboard')) return true;
  if (p.startsWith('/profile')) return true;
  return false;
}

async function getCustomTokenData(token: string | undefined): Promise<{ userId: string, role: string } | null> {
  if (!token) return null;
  if (!JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    if (payload.sub) {
      return { 
        userId: payload.sub as string, 
        role: (payload.role as string) || 'client' 
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Handle CORS preflight for API routes
  if (pathname.startsWith('/api')) {
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: corsHeaders });
    }
    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Skip internals and static files
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return;
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  const locale = pathnameHasLocale ? pathname.split('/')[1] : defaultLocale;
  const pathWithoutLocale = pathnameHasLocale ? pathname.replace(`/${locale}`, '') : pathname;

  // Locale fallback redirect (хуучин логик — auth-аас өмнө)
  if (!pathnameHasLocale) {
    const newUrl = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, req.url);
    return NextResponse.redirect(newUrl);
  }

  // Нээлттэй хуудсууд: Clerk auth() / JWT шалгалтгүйгээр шууд өнгөрөх
  if (!routeNeedsAuthGate(pathWithoutLocale)) {
    return NextResponse.next();
  }

  // AUTH PROTECTION LOGIC (зөвхөн хамгаалагдсан замууд)
  const redirectToLogin = () => {
    const loginUrl = new URL(`/${locale}/sign-in`, req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  };

  const customToken = req.cookies.get('auth_token')?.value;
  const customData = await getCustomTokenData(customToken);
  
  let role = null;
  let hasUser = false;
  
  if (customData) {
      hasUser = true;
      role = customData.role;
  } else {
      const authState = await auth();
      if (authState.userId) {
          hasUser = true;
          const sessionRole = (authState.sessionClaims?.metadata as any)?.role || (authState.sessionClaims?.publicMetadata as any)?.role;
          role = sessionRole || 'client';
      }
  }

  // Role-based Routing Rules
  // 1. Admin restricted routes
  if (pathWithoutLocale.startsWith('/admin')) {
      if (role !== 'admin') {
          return redirectToLogin();
      }
  }

  // 2. Monk restricted routes
  if (pathWithoutLocale.startsWith('/monk/content')) {
      if (role !== 'monk' && role !== 'admin') {
          return redirectToLogin();
      }
  }

  // 3. User restricted routes
  if (
      pathWithoutLocale.startsWith('/messenger') || 
      pathWithoutLocale.startsWith('/booking/') ||
      pathWithoutLocale.startsWith('/dashboard') ||
      pathWithoutLocale.startsWith('/profile')
  ) {
      if (!hasUser) {
          return redirectToLogin();
      }
  }

});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
