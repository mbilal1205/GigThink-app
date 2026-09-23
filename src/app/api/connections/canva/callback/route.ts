import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { encrypt } from '@/lib/email/encryption';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // user id

  if (!code || !state) {
    return NextResponse.json({ error: 'Invalid callback' }, { status: 400 });
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.CANVA_CLIENT_ID!,
      client_secret: process.env.CANVA_CLIENT_SECRET!,
      redirect_uri: process.env.NEXT_PUBLIC_CANVA_REDIRECT_URI!,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error('[CANVA_TOKEN_ERROR]', tokenData);
    return NextResponse.redirect(new URL('/settings/connections?error=canva_failed', req.url).toString());
  }

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;

  // Encrypt and store connection
  const encryptedAccess = encrypt(accessToken);
  const encryptedRefresh = encrypt(refreshToken);

  const { error: upsertError } = await supabaseAdmin
    .from('app_connections')
    .upsert({
      user_id: state,
      provider: 'canva',
      email: '', // Canva doesn't provide email easily; could fetch later
      access_token_encrypted: encryptedAccess,
      refresh_token_encrypted: encryptedRefresh,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });

  if (upsertError) {
    console.error('[CANVA_SAVE_ERROR]', upsertError);
    return NextResponse.redirect(new URL('/settings/connections?error=canva_save_failed', req.url).toString());
  }

  return NextResponse.redirect(new URL('/settings/connections?success=canva_connected', req.url).toString());
}