import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabaseAdmin';
import { hashString } from '@/utils/hash';
import { rateLimit } from '@/utils/rateLimit';
import { sendPasswordResetOTP } from '@/utils/sendEmail';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // Rate limit: 5 requests per 10 minutes per email
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`forgot-${ip}`, 5, 600000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Generic response always (prevent enumeration)
    const genericResponse = {
      success: true,
      message: 'If an account exists for this email, a password reset OTP has been sent.',
    };

    // Check if user exists (Supabase admin)
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) {
      console.error('Error fetching users:', userError);
      return NextResponse.json(genericResponse, { status: 200 });
    }

    const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      // User not found, but respond generic
      return NextResponse.json(genericResponse, { status: 200 });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await hashString(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old unused OTPs for this user
    await supabaseAdmin
      .from('password_reset_otps')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false);

    // Insert new OTP record
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_otps')
      .insert({
        user_id: user.id,
        otp_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        used: false,
      });

    if (insertError) {
      console.error('Error inserting OTP:', insertError);
      return NextResponse.json(genericResponse, { status: 200 });
    }


    // Purane emailHtml wale block ko remove karein aur ye use karein:
const emailSent = await sendPasswordResetOTP(email, otp, user.user_metadata?.name || '');

    if (!emailSent) {
      console.error('Failed to send OTP email');
      // Still return generic success to avoid enumeration
    }

    return NextResponse.json(genericResponse, { status: 200 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}