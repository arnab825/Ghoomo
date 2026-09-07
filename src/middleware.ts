import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  checkAuthRateLimit,
  checkAuthenticatedRateLimit,
  checkPublicRateLimit,
} from '@/lib/security/rateLimiter';

/**
 * EduSpark Edge Middleware
 * 
 * Enforces:
 * 1. Multi-tier sliding window rate limiting:
 *    - Strict on authentication endpoints (exponential backoff, per-IP + per-account)
 *    - Moderate on public marketing routes (per-IP)
 *    - Looser on authenticated app routes (per-user)
 * 2. Authoritative authentication guarding for /app and /admin
 * 3. Role-based access control (RBAC) ensuring only admin roles access /admin
 * 4. Automatic session refresh via Supabase SSR client
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 1. Strict rate limiting on authentication routes
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  if (isAuthRoute) {
    const authLimit = checkAuthRateLimit({ clientIp });
    if (!authLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: authLimit.error || 'Too many authentication attempts. Please retry later.',
          retryAfter: authLimit.resetSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(authLimit.resetSeconds),
          },
        }
      );
    }
  }

  // 2. Moderate rate limiting on public marketing routes
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/pricing' ||
    pathname === '/contact';

  if (isPublicRoute) {
    const publicLimit = checkPublicRateLimit(clientIp);
    if (!publicLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: publicLimit.error || 'Rate limit exceeded. Please slow down.',
          retryAfter: publicLimit.resetSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(publicLimit.resetSeconds),
          },
        }
      );
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Get authenticated user directly from Supabase Auth server session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAppPath = pathname.startsWith('/app');
  const isAdminPath = pathname.startsWith('/admin');

  // 3. Rate limiting for authenticated user actions on /app and /admin
  if (user && (isAppPath || isAdminPath)) {
    const userLimit = checkAuthenticatedRateLimit(user.id);
    if (!userLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: userLimit.error || 'Rate limit exceeded. Please slow down.',
          retryAfter: userLimit.resetSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(userLimit.resetSeconds),
          },
        }
      );
    }
  }

  // 4. Unauthenticated users cannot access /app or /admin
  if (!user && (isAppPath || isAdminPath)) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 5. Strict role protection for /admin routes
  if (user && isAdminPath) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  // 6. Authenticated users going to /login or /signup are redirected straight to /app
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/app/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/',
    '/about',
    '/pricing',
    '/contact',
  ],
};
