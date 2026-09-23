import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface SendUserEmailParams {
  userId: string;
  to: string;
  subject: string;
  html: string;
}

export async function sendUserEmail({ userId, to, subject, html }: SendUserEmailParams): Promise<boolean> {
  // Fetch Gmail connection
  const { data: connection, error } = await supabaseAdmin
    .from('app_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google_gmail')
    .single();

  if (error || !connection) {
    console.error('No Gmail connection found for user:', userId);
    return false;
  }

  // Check token expiry, refresh if needed (simplified: assume valid for demo)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: connection.email,
      accessToken: connection.access_token,
      refreshToken: connection.refresh_token || undefined,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  });

  try {
    await transporter.sendMail({
      from: connection.email,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('Gmail send error:', err);
    return false;
  }
}