import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const errorParam = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') ?? '/app';

  if (errorParam || errorDescription) {
    console.error('OAuth error from provider:', errorParam, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(errorDescription || errorParam || 'Authentication failed')}`,
        request.url
      )
    );
  }

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.session?.user) {
        const user = data.session.user;

        // Auto-provision profile if not present
        try {
          await supabase.from('profiles').upsert(
            {
              id: user.id,
              email: user.email,
              full_name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                'Learner',
              role: 'student',
              avatar_url:
                user.user_metadata?.avatar_url ||
                user.user_metadata?.picture ||
                null,
            },
            { onConflict: 'id' }
          );
        } catch (profileErr) {
          console.error('Error auto-creating profile for OAuth user:', profileErr);
        }

        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        if (isLocalEnv) {
          return NextResponse.redirect(new URL(next, request.url));
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(new URL(next, request.url));
        }
      }

      if (error) {
        console.error('Supabase exchangeCodeForSession error:', error);
        return NextResponse.redirect(
          new URL(
            `/login?error=${encodeURIComponent(error.message || 'code_exchange_failed')}`,
            request.url
          )
        );
      }
    } catch (err: any) {
      console.error('Unexpected error during auth callback exchange:', err);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(err.message || 'auth_callback_error')}`,
          request.url
        )
      );
    }
  }

  return NextResponse.redirect(new URL('/app', request.url));
}
