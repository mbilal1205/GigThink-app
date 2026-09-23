import nodemailer from 'nodemailer';
import { getOTPEmailTemplate, getWelcomeEmailTemplate } from './emailTemplates';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

 export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

export async function sendPasswordResetOTP(to: string, otp: string, name?: string): Promise<boolean> {
  const html = getOTPEmailTemplate(otp, name);
  return sendMail(to, 'GigThink - Password Reset OTP', html);
}

// Updated welcome email function with preferences parameter
export async function sendWelcomeEmail(
  to: string,
  name: string,
  preferences: {
    skills?: string[];
    experience_level?: string;
    min_budget?: number;
    preferred_markets?: string[];
    opportunity_types?: string[];
    target_client?: string[];
  }
): Promise<boolean> {
  const html = getWelcomeEmailTemplate(name, preferences);
  return sendMail(to, 'Welcome to GigThink!', html);
}