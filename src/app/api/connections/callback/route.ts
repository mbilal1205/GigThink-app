import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const provider = requestUrl.searchParams.get('provider') || 'google_gmail';

  if (!code) {
    return NextResponse.redirect(new URL('/settings/connections?error=oauth_failed', request.url));
  }

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    const user = data.user;
    const accessToken = data.session?.provider_token;
    const refreshToken = data.session?.provider_refresh_token || null;
    const userEmail = user?.email;

    if (!accessToken || !userEmail) throw new Error('Missing tokens');

    // Upsert connection
    const { error: upsertError } = await supabaseAdmin
      .from('app_connections')
      .upsert({
        user_id: user.id,
        provider,
        email: userEmail,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
      }, { onConflict: 'user_id,provider' });

    if (upsertError) throw upsertError;

    return NextResponse.redirect(new URL('/settings/connections?success=connected', request.url));
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(new URL('/settings/connections?error=oauth_failed', request.url));
  }
}