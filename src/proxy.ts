import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  checkAuthRateLimit,
  checkAuthenticatedRateLimit,
  checkPublicRateLimit,
} from '@/lib/security/rateLimiter';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 1. Rate limiting on authentication routes (login, signup, password resets)
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

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

  // 2. Rate limiting for authenticated user actions on /app and /admin
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

  // 3. Unauthenticated users cannot access /app or /admin
  if (!user && (isAppPath || isAdminPath)) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Strict role protection for /admin routes
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

  // 5. Authenticated users going to /login or /signup can be sent straight to /app
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*', '/login', '/signup', '/forgot-password', '/reset-password'],
};
