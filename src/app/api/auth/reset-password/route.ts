import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabaseAdmin';
import { compareHash, hashString } from '@/utils/hash';
import { cookies } from 'next/headers';
import { rateLimit } from '@/utils/rateLimit';

export async function POST(request: Request) {
  try {
    const { newPassword } = await request.json();
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    // Rate limit
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`reset-${ip}`, 5, 600000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    // Get reset token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('reset_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Reset token missing. Please start over.' }, { status: 400 });
    }

    // Find token record (hash compare)
    const tokenHash = await hashString(token); // Hashing the token to compare? We'll need to fetch all tokens? Better: find by token directly? Since we stored hash, we need to compare with stored hash.
    // We'll fetch all unused tokens and compare hashes (less efficient but okay for low volume). Alternatively, store token itself, but hash is safer.
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString());

    if (tokenError) {
      return NextResponse.json({ error: 'Token validation failed.' }, { status: 500 });
    }

    let matchedToken = null;
    for (const t of tokens || []) {
      const isValid = await compareHash(token, t.token_hash);
      if (isValid) {
        matchedToken = t;
        break;
      }
    }

    if (!matchedToken) {
      return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
    }

    // Update user password using supabase admin
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      matchedToken.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
    }

    // Mark token as used
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', matchedToken.id);

    // Clear cookie
    cookieStore.set('reset_token', '', { maxAge: 0, path: '/' });

    return NextResponse.json({ success: true, message: 'Password updated successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}