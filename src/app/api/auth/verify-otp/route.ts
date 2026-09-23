import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabaseAdmin';
import { compareHash, hashString } from '@/utils/hash';
import { rateLimit } from '@/utils/rateLimit';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required.' }, { status: 400 });
    }

    // Rate limit: 5 attempts per 10 minutes per email
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`verify-${ip}`, 5, 600000)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Find user by email
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) {
      return NextResponse.json({ error: 'User lookup failed.' }, { status: 500 });
    }

    const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      return NextResponse.json({ error: 'Invalid OTP.' }, { status: 400 });
    }

    // Fetch latest unused OTP for user
    const { data: otpRecords, error: otpError } = await supabaseAdmin
      .from('password_reset_otps')
      .select('*')
      .eq('user_id', user.id)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (otpError || !otpRecords || otpRecords.length === 0) {
      return NextResponse.json({ error: 'OTP expired or invalid.' }, { status: 400 });
    }

    const otpRecord = otpRecords[0];

    // Check attempts
    if (otpRecord.attempts >= 5) {
      // Mark as used to prevent further attempts
      await supabaseAdmin
        .from('password_reset_otps')
        .update({ used: true })
        .eq('id', otpRecord.id);
      return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new OTP.' }, { status: 400 });
    }

    // Compare OTP hash
    const isValid = await compareHash(otp, otpRecord.otp_hash);
    if (!isValid) {
      // Increment attempts
      await supabaseAdmin
        .from('password_reset_otps')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);
      return NextResponse.json({ error: 'Invalid OTP.' }, { status: 400 });
    }

    // OTP is valid: mark as used
    await supabaseAdmin
      .from('password_reset_otps')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // Generate reset token (random string)
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await hashString(token);
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token hash
    const { error: tokenInsertError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: tokenExpiresAt.toISOString(),
        used: false,
      });

    if (tokenInsertError) {
      console.error('Error storing reset token:', tokenInsertError);
      return NextResponse.json({ error: 'Could not create reset token.' }, { status: 500 });
    }

    // Set cookie with token (httpOnly, secure)
    const cookieStore = await cookies();
    cookieStore.set('reset_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    return NextResponse.json({ success: true, message: 'OTP verified successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}